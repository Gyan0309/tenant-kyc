import { countActivePersonsInRoom } from "@/lib/azure/repos/persons";
import { updateRoom } from "@/lib/azure/repos/rooms";
import type { RoomStatus } from "@/lib/types/enums";

export async function recalculateRoomStatus(
  propertyId: string,
  roomId: string,
  capacity: number,
): Promise<RoomStatus> {
  const count = await countActivePersonsInRoom(roomId);
  let status: RoomStatus;
  if (count === 0) status = "VACANT";
  else if (count >= capacity) status = "OCCUPIED";
  else status = "PARTIAL";

  await updateRoom(propertyId, roomId, { status });
  return status;
}
