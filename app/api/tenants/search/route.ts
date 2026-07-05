import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { handleApiError } from "@/lib/api/errors";
import { listPersonsByOwner } from "@/lib/azure/repos/persons";
import { listRoomsByOwner } from "@/lib/azure/repos/rooms";

// Owner-scoped tenant search: match a tenant name or a room number.
export async function GET(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    if (!q) return Response.json([]);

    const [persons, rooms] = await Promise.all([
      listPersonsByOwner(ownerId),
      listRoomsByOwner(ownerId),
    ]);
    const roomById = new Map(rooms.map((r) => [r.rowKey, r]));

    const results = persons
      .filter((p) => {
        const room = roomById.get(p.roomId);
        const roomNumber = (room?.roomNumber ?? "").toLowerCase();
        return p.name.toLowerCase().includes(q) || roomNumber.includes(q);
      })
      .slice(0, 20)
      .map((p) => {
        const room = roomById.get(p.roomId);
        return {
          id: p.rowKey,
          name: p.name,
          role: p.role,
          phone: p.phone,
          roomNumber: room?.roomNumber ?? "",
          propertyId: p.propertyId,
          roomId: p.roomId,
        };
      });

    return Response.json(results);
  } catch (err) {
    return handleApiError(err);
  }
}
