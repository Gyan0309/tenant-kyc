import { getTableClient } from "@/lib/azure/tables";
import type { PersonRole, SessionStatus } from "@/lib/types/enums";

export interface DigilockerProfilePayload {
  name: string;
  dob: string;
  gender: string;
  address: string;
  maskedAadhaar: string;
  phone?: string;
  photoBlobKey: string;
  aadhaarXmlBlobKey?: string;
  digilockerSub?: string;
}

export interface SessionEntity {
  partitionKey: string;
  rowKey: string;
  ownerId: string;
  roomId: string;
  propertyId: string;
  role: PersonRole;
  pkceVerifier: string;
  state: string;
  status: SessionStatus;
  expiresAt: string;
  contactPhone?: string;
  profilePayload?: string;
}

export async function createOAuthSession(
  ownerId: string,
  data: {
    roomId: string;
    propertyId: string;
    role: PersonRole;
    pkceVerifier: string;
    state: string;
    contactPhone?: string;
  },
): Promise<SessionEntity> {
  const client = getTableClient("Sessions");
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const entity: SessionEntity = {
    partitionKey: `OWNER-${ownerId}`,
    rowKey: `SESSION-${data.state}`,
    ownerId,
    roomId: data.roomId,
    propertyId: data.propertyId,
    role: data.role,
    pkceVerifier: data.pkceVerifier,
    state: data.state,
    status: "PENDING",
    expiresAt,
    contactPhone: data.contactPhone ?? "",
  };
  await client.createEntity(entity);
  return entity;
}

export async function getOAuthSession(
  state: string,
): Promise<SessionEntity | null> {
  const client = getTableClient("Sessions");
  const iter = client.listEntities<SessionEntity>({
    queryOptions: { filter: `RowKey eq 'SESSION-${state}'` },
  });
  for await (const entity of iter) {
    const session = entity as SessionEntity;
    if (new Date(session.expiresAt) < new Date()) {
      await updateSessionStatus(session.partitionKey, session.rowKey, "EXPIRED");
      return null;
    }
    return session;
  }
  return null;
}

export async function getOAuthSessionByPkceVerifier(
  pkceVerifier: string,
): Promise<SessionEntity | null> {
  const client = getTableClient("Sessions");
  const iter = client.listEntities<SessionEntity>({
    queryOptions: { filter: `pkceVerifier eq '${pkceVerifier}'` },
  });
  for await (const entity of iter) {
    const session = entity as SessionEntity;
    if (new Date(session.expiresAt) < new Date()) {
      await updateSessionStatus(session.partitionKey, session.rowKey, "EXPIRED");
      return null;
    }
    return session;
  }
  return null;
}

export async function getOAuthSessionForOwner(
  ownerId: string,
  state: string,
): Promise<SessionEntity | null> {
  const client = getTableClient("Sessions");
  try {
    const entity = await client.getEntity<SessionEntity>(
      `OWNER-${ownerId}`,
      `SESSION-${state}`,
    );
    const session = entity as SessionEntity;
    if (new Date(session.expiresAt) < new Date()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function completeOAuthSession(
  partitionKey: string,
  rowKey: string,
  profile: DigilockerProfilePayload,
): Promise<void> {
  const client = getTableClient("Sessions");
  await client.updateEntity(
    {
      partitionKey,
      rowKey,
      status: "COMPLETED",
      profilePayload: JSON.stringify(profile),
    },
    "Merge",
  );
}

export async function updateSessionStatus(
  partitionKey: string,
  rowKey: string,
  status: SessionStatus,
): Promise<void> {
  const client = getTableClient("Sessions");
  await client.updateEntity(
    { partitionKey, rowKey, status },
    "Merge",
  );
}
