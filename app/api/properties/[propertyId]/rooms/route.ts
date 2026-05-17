import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { getProperty } from "@/lib/azure/repos/properties";
import { listRoomsByProperty } from "@/lib/azure/repos/rooms";
import { handleApiError, jsonError } from "@/lib/api/errors";

type Params = { params: Promise<{ propertyId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { propertyId } = await params;

    const property = await getProperty(ownerId, propertyId);
    if (!property) return jsonError("Property not found", 404);

    const rooms = await listRoomsByProperty(propertyId);
    return Response.json(
      rooms.map((r) => ({
        id: r.rowKey,
        roomNumber: r.roomNumber,
        capacity: r.capacity,
        monthlyRent: r.monthlyRent,
        status: r.status,
        floor: r.floor,
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}
