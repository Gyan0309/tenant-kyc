import { getTableClient, odataValue } from "@/lib/azure/tables";
import { newRoomId } from "@/lib/ids";
import type { RoomStatus } from "@/lib/types/enums";

export interface RoomEntity {
  partitionKey: string;
  rowKey: string;
  propertyId: string;
  ownerId: string;
  roomNumber: string;
  capacity: number;
  monthlyRent: number;
  status: RoomStatus;
  floor: number;
}

export async function createRoom(
  propertyId: string,
  ownerId: string,
  data: {
    roomNumber: string;
    capacity: number;
    monthlyRent: number;
    floor?: number;
  },
): Promise<RoomEntity> {
  const client = getTableClient("Rooms");
  const roomId = newRoomId();
  const entity: RoomEntity = {
    partitionKey: propertyId,
    rowKey: roomId,
    propertyId,
    ownerId,
    roomNumber: data.roomNumber,
    capacity: data.capacity,
    monthlyRent: data.monthlyRent,
    status: "VACANT",
    floor: data.floor ?? 0,
  };
  await client.createEntity(entity);
  return entity;
}

export async function listRoomsByProperty(
  propertyId: string,
): Promise<RoomEntity[]> {
  const client = getTableClient("Rooms");
  const results: RoomEntity[] = [];
  const iter = client.listEntities<RoomEntity>({
    queryOptions: { filter: `PartitionKey eq '${odataValue(propertyId)}'` },
  });
  for await (const entity of iter) {
    results.push(entity as RoomEntity);
  }
  return results;
}

// All rooms for an owner in a single query. Used by the dashboard to avoid a
// per-property round trip (grouped by propertyId in memory by the caller).
export async function listRoomsByOwner(ownerId: string): Promise<RoomEntity[]> {
  const client = getTableClient("Rooms");
  const results: RoomEntity[] = [];
  const iter = client.listEntities<RoomEntity>({
    queryOptions: { filter: `ownerId eq '${odataValue(ownerId)}'` },
  });
  for await (const entity of iter) {
    results.push(entity as RoomEntity);
  }
  return results;
}

export async function getRoom(
  propertyId: string,
  roomId: string,
): Promise<RoomEntity | null> {
  const client = getTableClient("Rooms");
  try {
    const entity = await client.getEntity<RoomEntity>(propertyId, roomId);
    return entity as RoomEntity;
  } catch {
    return null;
  }
}

export async function findRoomById(roomId: string): Promise<RoomEntity | null> {
  const client = getTableClient("Rooms");
  const iter = client.listEntities<RoomEntity>({
    queryOptions: { filter: `RowKey eq '${odataValue(roomId)}'` },
  });
  for await (const entity of iter) {
    return entity as RoomEntity;
  }
  return null;
}

export async function updateRoom(
  propertyId: string,
  roomId: string,
  updates: Partial<
    Pick<RoomEntity, "roomNumber" | "capacity" | "monthlyRent" | "status" | "floor">
  >,
): Promise<RoomEntity> {
  const client = getTableClient("Rooms");
  const existing = await getRoom(propertyId, roomId);
  if (!existing) throw new Error("Room not found");
  const merged = { ...existing, ...updates };
  await client.updateEntity(merged, "Merge");
  return merged;
}
