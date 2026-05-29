import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { aadhaarOtpVerifySchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { getOAuthSessionForOwner } from "@/lib/azure/repos/sessions";
import { readAadhaarReference, verifyAadhaarOtp } from "@/lib/sandbox/kyc";

export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const body = await req.json();
    const data = aadhaarOtpVerifySchema.parse(body);

    const session = await getOAuthSessionForOwner(ownerId, data.state);
    if (!session || session.status !== "PENDING") {
      return jsonError("Session not found or expired", 404);
    }

    const referencePayload = readAadhaarReference(session.pkceVerifier);
    if (!referencePayload) return jsonError("Invalid Aadhaar session", 400);

    const [referenceId, maskedAadhaar = ""] = referencePayload.split(":");
    if (!referenceId || !maskedAadhaar) {
      return jsonError("Invalid Aadhaar session", 400);
    }

    await verifyAadhaarOtp({
      referenceId,
      otp: data.otp,
      maskedAadhaar,
      state: data.state,
      headers: req.headers,
    });

    return Response.json({ status: "COMPLETED" });
  } catch (err) {
    if (err instanceof Error && err.message === "invalid_session") {
      return jsonError("Session not found or expired", 404);
    }
    if (err instanceof Error && err.message === "Aadhaar verification failed") {
      return jsonError("Aadhaar verification failed", 400);
    }
    if (err instanceof Error && err.message.startsWith("Sandbox")) {
      console.error(err);
      return jsonError("KYC provider request failed", 502);
    }
    return handleApiError(err);
  }
}
