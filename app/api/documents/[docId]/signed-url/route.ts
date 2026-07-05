import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { findDocumentById } from "@/lib/azure/repos/documents";

type Params = { params: Promise<{ docId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { docId } = await params;

    const document = await findDocumentById(docId);
    if (!document || document.ownerId !== ownerId) {
      return jsonError("Document not found", 404);
    }

    const url = new URL(`/api/documents/${docId}/file`, req.url);

    return Response.json({ url, expiresInMinutes: 60 });
  } catch (err) {
    return handleApiError(err);
  }
}
