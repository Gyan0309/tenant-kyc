import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { getTableClient } from "@/lib/azure/tables";
import type { DocumentEntity } from "@/lib/azure/repos/documents";
import { generateReadSasUrl, getDocsContainer } from "@/lib/azure/blobs";

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

    const url = generateReadSasUrl(
      getDocsContainer(),
      document.blobKey,
      60,
    );

    return Response.json({ url, expiresInMinutes: 60 });
  } catch (err) {
    return handleApiError(err);
  }
}
