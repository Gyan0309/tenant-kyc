import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { createTenantSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { findPersonById } from "@/lib/azure/repos/persons";
import { createTenantFromSession } from "@/lib/tenants/create";
import { appendConsentLog, getRequestMeta } from "@/lib/consent/log";

type Params = { params: Promise<{ tenantId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { tenantId } = await params;

    const primary = await findPersonById(tenantId);
    if (!primary || primary.ownerId !== ownerId) {
      return jsonError("Primary tenant not found", 404);
    }

    const body = await req.json();
    const data = createTenantSchema.parse({
      ...body,
      roomId: primary.roomId,
      propertyId: primary.propertyId,
      role: body.role ?? "ROOMMATE",
    });

    const { person, profile } = await createTenantFromSession({
      ownerId,
      ...data,
    });

    const meta = getRequestMeta(req.headers);
    await appendConsentLog({
      personId: person.rowKey,
      ownerId,
      action: "AADHAAR_CONSENT_GIVEN",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      digilockerRequestId: profile.digilockerSub,
    });

    return Response.json({
      id: person.rowKey,
      name: person.name,
      role: person.role,
      isVerified: person.isVerified,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
