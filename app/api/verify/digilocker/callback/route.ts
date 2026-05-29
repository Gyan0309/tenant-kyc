import { NextRequest, NextResponse } from "next/server";
import {
  getOAuthSession,
  getOAuthSessionByPkceVerifier,
} from "@/lib/azure/repos/sessions";
import {
  completeSandboxDigiLockerIfReady,
  digilockerSessionReference,
} from "@/lib/sandbox/kyc";

export async function GET(req: NextRequest) {
  const baseUrl =
    process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const searchParams = req.nextUrl.searchParams;

  const localState = searchParams.get("local_state");
  const sandboxState = searchParams.get("state");
  const sandboxSessionId =
    searchParams.get("session_id") ?? parseSandboxSessionId(sandboxState);

  try {
    const session =
      (localState ? await getOAuthSession(localState) : null) ??
      (sandboxSessionId
        ? await getOAuthSessionByPkceVerifier(
            digilockerSessionReference(sandboxSessionId),
          )
        : null);

    if (!session) {
      return NextResponse.redirect(`${baseUrl}/auth/login?error=invalid_session`);
    }

    const verifierSessionId =
      sandboxSessionId ??
      session.pkceVerifier.replace(/^sandbox-digilocker:/, "");

    await completeSandboxDigiLockerIfReady({
      state: session.state,
      sessionId: verifierSessionId,
      headers: req.headers,
    });

    const redirectUrl = new URL(
      `/dashboard/properties/${session.propertyId}/rooms/${session.roomId}/add-person`,
      baseUrl,
    );
    redirectUrl.searchParams.set("state", session.state);
    redirectUrl.searchParams.set("role", session.role);
    redirectUrl.searchParams.set("verified", "1");
    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Sandbox DigiLocker callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/auth/login?error=digilocker_callback_failed`,
    );
  }
}

function parseSandboxSessionId(state: string | null): string | null {
  if (!state) return null;
  const parts = state.split("|");
  return parts.length >= 2 && parts[1] ? parts[1] : null;
}
