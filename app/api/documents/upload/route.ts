import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { findPersonById } from "@/lib/azure/repos/persons";
import { createDocument } from "@/lib/azure/repos/documents";
import { uploadBuffer, getDocsContainer } from "@/lib/azure/blobs";
import { appendConsentLog, getRequestMeta } from "@/lib/consent/log";
import { DOC_TYPES, type DocType } from "@/lib/types/enums";
export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const formData = await req.formData();
    const personId = formData.get("personId") as string;
    const docType = formData.get("docType") as DocType;
    const file = formData.get("file") as File | null;

    if (!personId || !file) {
      return jsonError("personId and file are required", 400);
    }
    if (!docType || !DOC_TYPES.includes(docType)) {
      return jsonError("Invalid docType", 400);
    }

    const person = await findPersonById(personId);
    if (!person || person.ownerId !== ownerId) {
      return jsonError("Person not found", 404);
    }

    const ext = file.name.split(".").pop() ?? "bin";
    const blobKey = `docs/${personId}/${docType.toLowerCase()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const container = getDocsContainer();

    await uploadBuffer(container, blobKey, buffer, file.type || "application/octet-stream");

    const doc = await createDocument({
      personId,
      roomId: person.roomId,
      ownerId,
      docType,
      blobKey,
      isVerified: false,
      source: "MANUAL_UPLOAD",
    });

    const meta = getRequestMeta(req.headers);
    await appendConsentLog({
      personId,
      ownerId,
      action: "DOCUMENT_UPLOADED",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return Response.json({
      id: doc.rowKey,
      docType: doc.docType,
      isVerified: doc.isVerified,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
