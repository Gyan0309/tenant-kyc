import { getTableClient } from "@/lib/azure/tables";
import { newDocumentId } from "@/lib/ids";
import type { DocSource, DocType } from "@/lib/types/enums";

export interface DocumentEntity {
  partitionKey: string;
  rowKey: string;
  personId: string;
  roomId: string;
  ownerId: string;
  docType: DocType;
  blobKey: string;
  isVerified: boolean;
  source: DocSource;
  uploadedAt: string;
  deletedAt: string | null;
}

export async function createDocument(
  data: Omit<DocumentEntity, "partitionKey" | "rowKey" | "deletedAt" | "uploadedAt">,
): Promise<DocumentEntity> {
  const client = getTableClient("Documents");
  const docId = newDocumentId();
  const entity: DocumentEntity = {
    partitionKey: data.personId,
    rowKey: docId,
    personId: data.personId,
    roomId: data.roomId,
    ownerId: data.ownerId,
    docType: data.docType,
    blobKey: data.blobKey,
    isVerified: data.isVerified,
    source: data.source,
    uploadedAt: new Date().toISOString(),
    deletedAt: null,
  };
  await client.createEntity({ ...entity, deletedAt: "" });
  return entity;
}

export async function listDocumentsByPerson(
  personId: string,
  includeDeleted = false,
): Promise<DocumentEntity[]> {
  const client = getTableClient("Documents");
  const results: DocumentEntity[] = [];
  const iter = client.listEntities<DocumentEntity>({
    queryOptions: { filter: `PartitionKey eq '${personId}'` },
  });
  for await (const entity of iter) {
    const doc = entity as DocumentEntity;
    const deletedAt = (doc.deletedAt as unknown as string) || "";
    if (!includeDeleted && deletedAt) continue;
    doc.deletedAt = deletedAt || null;
    results.push(doc);
  }
  return results;
}

export async function getDocument(
  personId: string,
  docId: string,
): Promise<DocumentEntity | null> {
  const client = getTableClient("Documents");
  try {
    const entity = await client.getEntity<DocumentEntity>(personId, docId);
    const deletedAt = (entity.deletedAt as unknown as string) || "";
    if (deletedAt) return null;
    return { ...(entity as DocumentEntity), deletedAt: null };
  } catch {
    return null;
  }
}

export async function softDeleteDocument(
  personId: string,
  docId: string,
): Promise<void> {
  const client = getTableClient("Documents");
  await client.updateEntity(
    {
      partitionKey: personId,
      rowKey: docId,
      deletedAt: new Date().toISOString(),
    },
    "Merge",
  );
}
