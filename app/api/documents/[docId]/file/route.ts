import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { getTableClient } from "@/lib/azure/tables";
import type { DocumentEntity } from "@/lib/azure/repos/documents";
import { downloadBuffer, getDocsContainer } from "@/lib/azure/blobs";

type Params = { params: Promise<{ docId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { docId } = await params;

    const client = getTableClient("Documents");
    const iter = client.listEntities<DocumentEntity>({
      queryOptions: { filter: `RowKey eq '${docId}'` },
    });

    let document: DocumentEntity | null = null;
    for await (const entity of iter) {
      document = entity as DocumentEntity;
      break;
    }

    if (!document || document.ownerId !== ownerId) {
      return jsonError("Document not found", 404);
    }

    const deletedAt = (document.deletedAt as unknown as string) || "";
    if (deletedAt) return jsonError("Document not found", 404);

    const buffer = await downloadBuffer(getDocsContainer(), document.blobKey);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentTypeFor(document.blobKey),
        "Content-Disposition": `inline; filename="${safeFilename(document)}"`,
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

function contentTypeFor(blobKey: string): string {
  const lower = blobKey.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".enc")) return "application/octet-stream";
  return "application/octet-stream";
}

function safeFilename(document: DocumentEntity): string {
  const extension = document.blobKey.split(".").pop() || "bin";
  return `${document.docType.toLowerCase()}.${extension.replace(/[^a-z0-9]/gi, "")}`;
}
