import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { createTenantSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { createTenantFromSession } from "@/lib/tenants/create";
import { appendConsentLog, getRequestMeta } from "@/lib/consent/log";

export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const body = await req.json();
    const data = createTenantSchema.parse(body);

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
      isVerified: person.isVerified,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("not found")) {
      return jsonError(err.message, 404);
    }
    if (err instanceof Error && err.message.includes("session")) {
      return jsonError(err.message, 400);
    }
    return handleApiError(err);
  }
}
