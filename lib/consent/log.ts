import { getTableClient } from "@/lib/azure/tables";
import { newConsentLogId } from "@/lib/ids";
import type { ConsentAction } from "@/lib/types/enums";

export interface ConsentLogInput {
  personId?: string;
  ownerId: string;
  action: ConsentAction;
  ipAddress?: string;
  userAgent?: string;
  digilockerRequestId?: string;
  partitionKeyOverride?: string;
}

export function getRequestMeta(headers: Headers): {
  ipAddress: string;
  userAgent: string;
} {
  const forwarded = headers.get("x-forwarded-for");
  const ipAddress = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = headers.get("user-agent") ?? "unknown";
  return { ipAddress, userAgent };
}

export async function appendConsentLog(
  input: ConsentLogInput,
): Promise<void> {
  const client = getTableClient("ConsentLogs");
  const partitionKey =
    input.partitionKeyOverride ??
    (input.personId ? `TNT-${input.personId}` : `OWNER-${input.ownerId}`);
  const rowKey = newConsentLogId();
  const timestamp = new Date().toISOString();

  await client.createEntity({
    partitionKey,
    rowKey,
    personId: input.personId ?? "",
    ownerId: input.ownerId,
    action: input.action,
    ipAddress: input.ipAddress ?? "",
    userAgent: input.userAgent ?? "",
    timestamp,
    digilockerRequestId: input.digilockerRequestId ?? "",
  });
}

/** Stub for post-retention blob deletion */
export function scheduleBlobDeletion(
  _blobKeys: string[],
  _reason: string,
): void {
  // TODO: integrate with Azure Functions / queue for legal retention window
}
