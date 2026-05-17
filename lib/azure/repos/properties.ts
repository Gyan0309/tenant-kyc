import { getTableClient } from "@/lib/azure/tables";
import { newPropertyId } from "@/lib/ids";

export interface PropertyEntity {
  partitionKey: string;
  rowKey: string;
  ownerId: string;
  name: string;
  address: string;
  city: string;
  totalRooms: number;
  createdAt: string;
}

export async function createProperty(
  ownerId: string,
  data: { name: string; address: string; city: string; totalRooms?: number },
): Promise<PropertyEntity> {
  const client = getTableClient("Properties");
  const propertyId = newPropertyId();
  const entity: PropertyEntity = {
    partitionKey: ownerId,
    rowKey: propertyId,
    ownerId,
    name: data.name,
    address: data.address,
    city: data.city,
    totalRooms: data.totalRooms ?? 0,
    createdAt: new Date().toISOString(),
  };
  await client.createEntity(entity);
  return entity;
}

export async function listPropertiesByOwner(
  ownerId: string,
): Promise<PropertyEntity[]> {
  const client = getTableClient("Properties");
  const results: PropertyEntity[] = [];
  const iter = client.listEntities<PropertyEntity>({
    queryOptions: { filter: `PartitionKey eq '${ownerId}'` },
  });
  for await (const entity of iter) {
    results.push(entity as PropertyEntity);
  }
  return results;
}

export async function getProperty(
  ownerId: string,
  propertyId: string,
): Promise<PropertyEntity | null> {
  const client = getTableClient("Properties");
  try {
    const entity = await client.getEntity<PropertyEntity>(
      ownerId,
      propertyId,
    );
    return entity as PropertyEntity;
  } catch {
    return null;
  }
}

export async function updateProperty(
  ownerId: string,
  propertyId: string,
  updates: Partial<Pick<PropertyEntity, "name" | "address" | "city" | "totalRooms">>,
): Promise<PropertyEntity> {
  const client = getTableClient("Properties");
  const existing = await getProperty(ownerId, propertyId);
  if (!existing) throw new Error("Property not found");

  const merged = { ...existing, ...updates };
  await client.updateEntity(merged, "Merge");
  return merged;
}

export async function deleteProperty(
  ownerId: string,
  propertyId: string,
): Promise<void> {
  const client = getTableClient("Properties");
  await client.deleteEntity(ownerId, propertyId);
}
