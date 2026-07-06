import { NextRequest } from "next/server";
import { createRoom, listRoomsByProperty } from "@/lib/azure/repos/rooms";
import { getProperty } from "@/lib/azure/repos/properties";
import { requireOwner } from "@/lib/auth/session";
import { createRoomSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const body = await req.json();
    const data = createRoomSchema.parse(body);

    const property = await getProperty(ownerId, data.propertyId);
    if (!property) return jsonError("Property not found", 404);

    // Room numbers must be unique within a property (case-insensitive).
    const existing = await listRoomsByProperty(data.propertyId);
    const wanted = data.roomNumber.trim().toLowerCase();
    if (existing.some((r) => r.roomNumber.trim().toLowerCase() === wanted)) {
      return jsonError(`Room "${data.roomNumber}" already exists in this property`, 409);
    }

    const room = await createRoom(data.propertyId, ownerId, {
      roomNumber: data.roomNumber,
      capacity: data.capacity,
      monthlyRent: data.monthlyRent,
      floor: data.floor,
    });

    return Response.json({
      id: room.rowKey,
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      capacity: room.capacity,
      monthlyRent: room.monthlyRent,
      status: room.status,
      floor: room.floor,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
