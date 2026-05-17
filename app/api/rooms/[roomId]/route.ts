import { NextRequest } from "next/server";
import { findRoomById, getRoom, updateRoom } from "@/lib/azure/repos/rooms";
import { requireOwner } from "@/lib/auth/session";
import { updateRoomSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { listPersonsByRoom } from "@/lib/azure/repos/persons";

type Params = { params: Promise<{ roomId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { roomId } = await params;

    const room = await findRoomById(roomId);
    if (!room || room.ownerId !== ownerId) {
      return jsonError("Room not found", 404);
    }

    const persons = await listPersonsByRoom(roomId);

    return Response.json({
      id: room.rowKey,
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      monthlyRent: room.monthlyRent,
      status: room.status,
      floor: room.floor,
      persons: persons.map((p) => ({
        id: p.rowKey,
        name: p.name,
        role: p.role,
        isVerified: p.isVerified,
        phone: p.phone,
        moveInDate: p.moveInDate,
      })),
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { roomId } = await params;

    const room = await findRoomById(roomId);
    if (!room || room.ownerId !== ownerId) {
      return jsonError("Room not found", 404);
    }

    const body = await req.json();
    const data = updateRoomSchema.parse(body);
    const updated = await updateRoom(room.propertyId, roomId, data);

    return Response.json({
      id: updated.rowKey,
      status: updated.status,
      roomNumber: updated.roomNumber,
      capacity: updated.capacity,
      monthlyRent: updated.monthlyRent,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
