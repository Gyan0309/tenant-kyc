import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { getOAuthSessionForOwner } from "@/lib/azure/repos/sessions";
import { handleApiError, jsonError } from "@/lib/api/errors";
import {
  completeSandboxDigiLockerIfReady,
  readDigilockerSessionReference,
} from "@/lib/sandbox/kyc";

export async function GET(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const state = req.nextUrl.searchParams.get("state");
    if (!state) return jsonError("state is required", 400);

    let session = await getOAuthSessionForOwner(ownerId, state);
    if (!session) return jsonError("Session not found or expired", 404);

    const sandboxSessionId = readDigilockerSessionReference(session.pkceVerifier);
    if (session.status === "PENDING" && sandboxSessionId) {
      await completeSandboxDigiLockerIfReady({
        state,
        sessionId: sandboxSessionId,
        headers: req.headers,
      });
      session = await getOAuthSessionForOwner(ownerId, state);
      if (!session) return jsonError("Session not found or expired", 404);
    }

    let profile = null;
    if (session.status === "COMPLETED" && session.profilePayload) {
      profile = JSON.parse(session.profilePayload);
    }

    return Response.json({
      status: session.status,
      profile,
      roomId: session.roomId,
      propertyId: session.propertyId,
      role: session.role,
    });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Sandbox")) {
      console.error(err);
      return jsonError("KYC provider request failed", 502);
    }
    return handleApiError(err);
  }
}
