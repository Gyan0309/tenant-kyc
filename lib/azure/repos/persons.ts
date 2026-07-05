import { getTableClient, odataValue } from "@/lib/azure/tables";
import { newTenantId } from "@/lib/ids";
import type { PersonRole } from "@/lib/types/enums";

export interface PersonEntity {
  partitionKey: string;
  rowKey: string;
  roomId: string;
  propertyId: string;
  ownerId: string;
  role: PersonRole;
  relation: string;
  name: string;
  dob: string;
  gender: string;
  maskedAadhaar: string;
  phone: string;
  address: string;
  photoBlobKey: string;
  isVerified: boolean;
  verifiedAt: string;
  moveInDate: string;
  emergencyContact: string;
  deletedAt: string | null;
}

export async function createPerson(
  data: Omit<PersonEntity, "partitionKey" | "rowKey" | "deletedAt"> & {
    rowKey?: string;
  },
): Promise<PersonEntity> {
  const client = getTableClient("Persons");
  const tenantId = data.rowKey ?? newTenantId();
  const entity: PersonEntity = {
    partitionKey: data.roomId,
    rowKey: tenantId,
    roomId: data.roomId,
    propertyId: data.propertyId,
    ownerId: data.ownerId,
    role: data.role,
    relation: data.relation ?? "",
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    maskedAadhaar: data.maskedAadhaar,
    phone: data.phone,
    address: data.address,
    photoBlobKey: data.photoBlobKey,
    isVerified: data.isVerified,
    verifiedAt: data.verifiedAt,
    moveInDate: data.moveInDate,
    emergencyContact: data.emergencyContact ?? "",
    deletedAt: null,
  };
  await client.createEntity({ ...entity, deletedAt: "" });
  return entity;
}

export async function listPersonsByRoom(
  roomId: string,
  includeDeleted = false,
): Promise<PersonEntity[]> {
  const client = getTableClient("Persons");
  const results: PersonEntity[] = [];
  const iter = client.listEntities<PersonEntity>({
    queryOptions: { filter: `PartitionKey eq '${odataValue(roomId)}'` },
  });
  for await (const entity of iter) {
    const person = entity as PersonEntity;
    const deletedAt = (person.deletedAt as unknown as string) || "";
    if (!includeDeleted && deletedAt) continue;
    person.deletedAt = deletedAt || null;
    results.push(person);
  }
  return results;
}

// All active persons for an owner in a single query. Used by the dashboard to
// replace one query per room when computing tenant totals.
export async function listPersonsByOwner(
  ownerId: string,
): Promise<PersonEntity[]> {
  const client = getTableClient("Persons");
  const results: PersonEntity[] = [];
  const iter = client.listEntities<PersonEntity>({
    queryOptions: { filter: `ownerId eq '${odataValue(ownerId)}'` },
  });
  for await (const entity of iter) {
    const person = entity as PersonEntity;
    const deletedAt = (person.deletedAt as unknown as string) || "";
    if (deletedAt) continue;
    person.deletedAt = null;
    results.push(person);
  }
  return results;
}

export async function getPerson(
  roomId: string,
  tenantId: string,
): Promise<PersonEntity | null> {
  const client = getTableClient("Persons");
  try {
    const entity = await client.getEntity<PersonEntity>(roomId, tenantId);
    const deletedAt = (entity.deletedAt as unknown as string) || "";
    if (deletedAt) return null;
    return { ...(entity as PersonEntity), deletedAt: null };
  } catch {
    return null;
  }
}

export async function findPersonById(
  tenantId: string,
): Promise<PersonEntity | null> {
  const client = getTableClient("Persons");
  const iter = client.listEntities<PersonEntity>({
    queryOptions: { filter: `RowKey eq '${odataValue(tenantId)}'` },
  });
  for await (const entity of iter) {
    const deletedAt = (entity.deletedAt as unknown as string) || "";
    if (deletedAt) return null;
    return { ...(entity as PersonEntity), deletedAt: null };
  }
  return null;
}

export async function updatePerson(
  roomId: string,
  tenantId: string,
  updates: Partial<Pick<PersonEntity, "phone" | "moveInDate" | "emergencyContact">>,
): Promise<PersonEntity> {
  const client = getTableClient("Persons");
  const existing = await client.getEntity<PersonEntity>(roomId, tenantId);
  const merged = { ...existing, ...updates };
  await client.updateEntity(merged, "Merge");
  return merged as PersonEntity;
}

export async function setPersonPhoto(
  roomId: string,
  tenantId: string,
  photoBlobKey: string,
): Promise<void> {
  const client = getTableClient("Persons");
  await client.updateEntity(
    { partitionKey: roomId, rowKey: tenantId, photoBlobKey },
    "Merge",
  );
}

export async function softDeletePerson(
  roomId: string,
  tenantId: string,
): Promise<void> {
  const client = getTableClient("Persons");
  await client.updateEntity(
    {
      partitionKey: roomId,
      rowKey: tenantId,
      deletedAt: new Date().toISOString(),
    },
    "Merge",
  );
}

export async function countActivePersonsInRoom(roomId: string): Promise<number> {
  const persons = await listPersonsByRoom(roomId);
  return persons.length;
}
