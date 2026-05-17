import { NextRequest } from "next/server";
import {
  deleteProperty,
  getProperty,
  updateProperty,
} from "@/lib/azure/repos/properties";
import { requireOwner } from "@/lib/auth/session";
import { updatePropertySchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";

type Params = { params: Promise<{ propertyId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { propertyId } = await params;

    const property = await getProperty(ownerId, propertyId);
    if (!property) return jsonError("Property not found", 404);

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

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { propertyId } = await params;

    const body = await req.json();
    const data = updatePropertySchema.parse(body);
    const property = await updateProperty(ownerId, propertyId, data);

    return Response.json({
      id: property.rowKey,
      name: property.name,
      address: property.address,
      city: property.city,
      totalRooms: property.totalRooms,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { propertyId } = await params;

    await deleteProperty(ownerId, propertyId);
    return Response.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
