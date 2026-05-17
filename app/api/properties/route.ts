import { NextRequest } from "next/server";
import {
  createProperty,
  listPropertiesByOwner,
} from "@/lib/azure/repos/properties";
import { requireOwner } from "@/lib/auth/session";
import { createPropertySchema } from "@/lib/types/validation";
import { handleApiError } from "@/lib/api/errors";

export async function GET() {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const properties = await listPropertiesByOwner(ownerId);
    return Response.json(
      properties.map((p) => ({
        id: p.rowKey,
        name: p.name,
        address: p.address,
        city: p.city,
        totalRooms: p.totalRooms,
        createdAt: p.createdAt,
      })),
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const body = await req.json();
    const data = createPropertySchema.parse(body);
    const property = await createProperty(ownerId, data);

    return Response.json({
      id: property.rowKey,
      name: property.name,
      address: property.address,
      city: property.city,
      totalRooms: property.totalRooms,
      createdAt: property.createdAt,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
