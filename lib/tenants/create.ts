import {
  createPerson,
  softDeletePerson,
  listPersonsByRoom,
  setPersonPhoto,
} from "@/lib/azure/repos/persons";
import { optimizeAvatar } from "@/lib/images/optimize";
import { createDocument, softDeleteDocument } from "@/lib/azure/repos/documents";
import { findRoomById } from "@/lib/azure/repos/rooms";
import {
  deleteBlob,
  getDocsContainer,
  uploadBuffer,
} from "@/lib/azure/blobs";
import { recalculateRoomStatus } from "@/lib/rooms/status";
import { removePdfPasswordIfPresent } from "@/lib/pdf/decrypt";
import { newTenantId } from "@/lib/ids";
import type { PersonRole } from "@/lib/types/enums";

export interface CreateManualTenantInput {
  ownerId: string;
  roomId: string;
  propertyId: string;
  phone: string;
  moveInDate?: string;
  emergencyContact?: string;
  role: PersonRole;
  relation?: string;
  name: string;
  dob?: string;
  gender?: string;
  address?: string;
  aadhaarLast4?: string;
  // Aadhaar is required for the primary tenant, optional for roommates/family.
  aadhaarFile?: File | null;
  aadhaarPassword?: string;
  photoFile?: File | null;
}

export async function createTenantFromManualUpload(input: CreateManualTenantInput) {
  const room = await findRoomById(input.roomId);
  if (!room || room.ownerId !== input.ownerId || room.propertyId !== input.propertyId) {
    throw new Error("Room not found");
  }

  // Roommates & family inherit address and move-in date from the primary tenant.
  let address = input.address ?? "";
  let moveInDate = input.moveInDate ?? "";
  if (input.role !== "PRIMARY" && (!address || !moveInDate)) {
    const primary = (await listPersonsByRoom(input.roomId)).find(
      (p) => p.role === "PRIMARY",
    );
    if (primary) {
      if (!address) address = primary.address;
      if (!moveInDate) moveInDate = primary.moveInDate;
    }
  }
  if (!moveInDate) moveInDate = new Date().toISOString().slice(0, 10);

  const tenantId = newTenantId();
  const container = getDocsContainer();
  const hasAadhaar = !!input.aadhaarFile && input.aadhaarFile.size > 0;

  let blobKey = "";
  let buffer: Buffer | null = null;
  if (hasAadhaar && input.aadhaarFile) {
    blobKey = `docs/${tenantId}/aadhaar.${fileExtension(input.aadhaarFile.name)}`;
    // Decrypt the Aadhaar PDF if password protected so the stored copy opens
    // without a password. Throws PdfPasswordError on a missing/wrong password.
    buffer = await removePdfPasswordIfPresent(
      Buffer.from(await input.aadhaarFile.arrayBuffer()),
      input.aadhaarFile.name,
      input.aadhaarFile.type,
      input.aadhaarPassword,
    );
  }

  let uploaded = false;
  let personCreated = false;
  let documentId = "";

  try {
    if (hasAadhaar && input.aadhaarFile && buffer) {
      await uploadBuffer(
        container,
        blobKey,
        buffer,
        input.aadhaarFile.type || "application/octet-stream",
      );
      uploaded = true;
    }

    const person = await createPerson({
      rowKey: tenantId,
      roomId: input.roomId,
      propertyId: input.propertyId,
      ownerId: input.ownerId,
      role: input.role,
      relation: input.relation ?? "",
      name: input.name,
      dob: input.dob ?? "",
      gender: input.gender ?? "",
      maskedAadhaar: input.aadhaarLast4 ? `XXXX XXXX ${input.aadhaarLast4}` : "",
      phone: input.phone,
      address,
      photoBlobKey: "",
      isVerified: false,
      verifiedAt: "",
      moveInDate,
      emergencyContact: input.emergencyContact ?? "",
    });
    personCreated = true;

    let document = null;
    if (uploaded) {
      document = await createDocument({
        personId: person.rowKey,
        roomId: input.roomId,
        ownerId: input.ownerId,
        docType: "AADHAAR",
        blobKey,
        isVerified: false,
        source: "MANUAL_UPLOAD",
      });
      documentId = document.rowKey;
    }

    // Optional tenant photo — optimized before storing. Best-effort: a photo
    // failure should not roll back an otherwise-valid tenant.
    if (input.photoFile && input.photoFile.size > 0) {
      try {
        const optimized = await optimizeAvatar(
          Buffer.from(await input.photoFile.arrayBuffer()),
        );
        const photoKey = `persons/${tenantId}/photo.jpg`;
        await uploadBuffer(container, photoKey, optimized, "image/jpeg");
        await setPersonPhoto(input.roomId, tenantId, photoKey);
        person.photoBlobKey = photoKey;
      } catch (photoErr) {
        console.error("Tenant photo skipped:", photoErr);
      }
    }

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
