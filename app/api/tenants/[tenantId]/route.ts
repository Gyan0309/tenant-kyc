import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import {
  findPersonById,
  softDeletePerson,
  updatePerson,
} from "@/lib/azure/repos/persons";
import { listDocumentsByPerson } from "@/lib/azure/repos/documents";
import { findRoomById } from "@/lib/azure/repos/rooms";
import { updateTenantSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { recalculateRoomStatus } from "@/lib/rooms/status";
import {
  appendConsentLog,
  getRequestMeta,
  scheduleBlobDeletion,
} from "@/lib/consent/log";

type Params = { params: Promise<{ tenantId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { tenantId } = await params;

    const person = await findPersonById(tenantId);
    if (!person || person.ownerId !== ownerId) {
      return jsonError("Tenant not found", 404);
    }

    const documents = await listDocumentsByPerson(tenantId);

    return Response.json({
      id: person.rowKey,
      roomId: person.roomId,
      propertyId: person.propertyId,
      role: person.role,
      name: person.name,
      dob: person.dob,
      gender: person.gender,
      maskedAadhaar: person.maskedAadhaar,
      phone: person.phone,
      address: person.address,
      photoBlobKey: person.photoBlobKey,
      isVerified: person.isVerified,
      verifiedAt: person.verifiedAt,
      moveInDate: person.moveInDate,
      emergencyContact: person.emergencyContact,
      documents: documents.map((d) => ({
        id: d.rowKey,
        docType: d.docType,
        isVerified: d.isVerified,
        source: d.source,
        uploadedAt: d.uploadedAt,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { tenantId } = await params;

    const person = await findPersonById(tenantId);
    if (!person || person.ownerId !== ownerId) {
      return jsonError("Tenant not found", 404);
    }

    const body = await req.json();
    const data = updateTenantSchema.parse(body);
    const updated = await updatePerson(person.roomId, tenantId, data);

    return Response.json({
      id: updated.rowKey,
      phone: updated.phone,
      moveInDate: updated.moveInDate,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { tenantId } = await params;

    const person = await findPersonById(tenantId);
    if (!person || person.ownerId !== ownerId) {
      return jsonError("Tenant not found", 404);
    }

    const erasure = req.nextUrl.searchParams.get("erasure") === "1";

    await softDeletePerson(person.roomId, tenantId);

    const meta = getRequestMeta(req.headers);
    await appendConsentLog({
      personId: tenantId,
      ownerId,
      action: erasure ? "DATA_ERASURE_REQUESTED" : "PERSON_DELETED",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    const blobKeys = [person.photoBlobKey].filter(Boolean);
    scheduleBlobDeletion(blobKeys, erasure ? "erasure" : "soft_delete");

    const room = await findRoomById(person.roomId);
    if (room) {
      await recalculateRoomStatus(room.propertyId, person.roomId, room.capacity);
    }

    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
