import { createPerson, softDeletePerson } from "@/lib/azure/repos/persons";
import { createDocument, softDeleteDocument } from "@/lib/azure/repos/documents";
import { findRoomById } from "@/lib/azure/repos/rooms";
import {
  deleteBlob,
  getDocsContainer,
  uploadBuffer,
} from "@/lib/azure/blobs";
import { recalculateRoomStatus } from "@/lib/rooms/status";
import { newTenantId } from "@/lib/ids";
import type { PersonRole } from "@/lib/types/enums";

export interface CreateManualTenantInput {
  ownerId: string;
  roomId: string;
  propertyId: string;
  phone: string;
  moveInDate: string;
  emergencyContact?: string;
  role: PersonRole;
  name: string;
  dob?: string;
  gender?: string;
  address: string;
  aadhaarLast4?: string;
  aadhaarFile: File;
}

export async function createTenantFromManualUpload(input: CreateManualTenantInput) {
  const room = await findRoomById(input.roomId);
  if (!room || room.ownerId !== input.ownerId || room.propertyId !== input.propertyId) {
    throw new Error("Room not found");
  }

  const tenantId = newTenantId();
  const container = getDocsContainer();
  const blobKey = `docs/${tenantId}/aadhaar.${fileExtension(input.aadhaarFile.name)}`;
  const buffer = Buffer.from(await input.aadhaarFile.arrayBuffer());
  let uploaded = false;
  let personCreated = false;
  let documentId = "";

  try {
    await uploadBuffer(
      container,
      blobKey,
      buffer,
      input.aadhaarFile.type || "application/octet-stream",
    );
    uploaded = true;

    const person = await createPerson({
      rowKey: tenantId,
      roomId: input.roomId,
      propertyId: input.propertyId,
      ownerId: input.ownerId,
      role: input.role,
      name: input.name,
      dob: input.dob ?? "",
      gender: input.gender ?? "",
      maskedAadhaar: input.aadhaarLast4 ? `XXXX XXXX ${input.aadhaarLast4}` : "",
      phone: input.phone,
      address: input.address,
      photoBlobKey: "",
      isVerified: false,
      verifiedAt: "",
      moveInDate: input.moveInDate,
      emergencyContact: input.emergencyContact ?? "",
    });
    personCreated = true;

    const document = await createDocument({
      personId: person.rowKey,
      roomId: input.roomId,
      ownerId: input.ownerId,
      docType: "AADHAAR",
      blobKey,
      isVerified: false,
      source: "MANUAL_UPLOAD",
    });
    documentId = document.rowKey;

    await recalculateRoomStatus(input.propertyId, input.roomId, room.capacity);

    return { person, document };
  } catch (err) {
    if (documentId) {
      await softDeleteDocument(tenantId, documentId).catch(() => undefined);
    }
    if (personCreated) {
      await softDeletePerson(input.roomId, tenantId).catch(() => undefined);
    }
    if (uploaded) {
      await deleteBlob(container, blobKey).catch(() => undefined);
    }
    throw err;
  }
}

function fileExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext || "bin";
}
