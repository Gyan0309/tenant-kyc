import { getOAuthSessionForOwner } from "@/lib/azure/repos/sessions";
import { createPerson } from "@/lib/azure/repos/persons";
import { createDocument } from "@/lib/azure/repos/documents";
import { findRoomById } from "@/lib/azure/repos/rooms";
import {
  copyBlob,
  deleteBlob,
  getDocsContainer,
} from "@/lib/azure/blobs";
import { recalculateRoomStatus } from "@/lib/rooms/status";
import { appendConsentLog } from "@/lib/consent/log";
import { newTenantId } from "@/lib/ids";
import type { DigilockerProfilePayload } from "@/lib/azure/repos/sessions";
import type { PersonRole } from "@/lib/types/enums";

export interface CreateTenantInput {
  ownerId: string;
  roomId: string;
  propertyId: string;
  sessionState: string;
  phone?: string;
  moveInDate: string;
  emergencyContact?: string;
  role: PersonRole;
  name?: string;
  dob?: string;
  gender?: string;
  address?: string;
  maskedAadhaar?: string;
}

export async function createTenantFromSession(input: CreateTenantInput) {
  const room = await findRoomById(input.roomId);
  if (!room || room.ownerId !== input.ownerId) {
    throw new Error("Room not found");
  }

  const session = await getOAuthSessionForOwner(
    input.ownerId,
    input.sessionState,
  );
  if (!session || session.status !== "COMPLETED" || !session.profilePayload) {
    throw new Error("DigiLocker verification session invalid or expired");
  }

  const profile = JSON.parse(
    session.profilePayload,
  ) as DigilockerProfilePayload;

  const container = getDocsContainer();
  const tenantId = newTenantId();

  const finalPhotoKey = profile.photoBlobKey
    ? `persons/${tenantId}/photo.jpg`
    : "";

  if (profile.photoBlobKey) {
    await copyBlob(container, profile.photoBlobKey, finalPhotoKey);
    await deleteBlob(container, profile.photoBlobKey);
  }

  let finalXmlKey = "";
  if (profile.aadhaarXmlBlobKey) {
    finalXmlKey = `docs/${tenantId}/aadhaar.xml.enc`;
    await copyBlob(container, profile.aadhaarXmlBlobKey, finalXmlKey);
    await deleteBlob(container, profile.aadhaarXmlBlobKey);
  }

  const person = await createPerson({
    rowKey: tenantId,
    roomId: input.roomId,
    propertyId: input.propertyId,
    ownerId: input.ownerId,
    role: input.role,
    name: input.name ?? profile.name,
    dob: input.dob ?? profile.dob,
    gender: input.gender ?? profile.gender,
    maskedAadhaar: input.maskedAadhaar ?? profile.maskedAadhaar,
    phone: input.phone || profile.phone || "",
    address: input.address ?? profile.address,
    photoBlobKey: finalPhotoKey,
    isVerified: true,
    verifiedAt: new Date().toISOString(),
    moveInDate: input.moveInDate,
    emergencyContact: input.emergencyContact ?? "",
  });

  if (finalXmlKey) {
    await createDocument({
      personId: person.rowKey,
      roomId: input.roomId,
      ownerId: input.ownerId,
      docType: "AADHAAR",
      blobKey: finalXmlKey,
      isVerified: true,
      source: "DIGILOCKER",
    });
  }

  await recalculateRoomStatus(input.propertyId, input.roomId, room.capacity);

  return { person, profile };
}
