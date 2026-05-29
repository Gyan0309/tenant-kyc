import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { aadhaarOtpInitiateSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { findRoomById } from "@/lib/azure/repos/rooms";
import { createOAuthSession } from "@/lib/azure/repos/sessions";
import { generateRandomString } from "@/lib/digilocker/pkce";
import {
  aadhaarReference,
  generateAadhaarOtp,
  maskAadhaar,
} from "@/lib/sandbox/kyc";
import { getSandboxConfig } from "@/lib/sandbox/config";

export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    try {
      if (!getSandboxConfig()) {
        return jsonError(
          "Sandbox KYC is not configured. Set SANDBOX_API_KEY and SANDBOX_API_SECRET.",
          503,
        );
      }
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Sandbox KYC is misconfigured.",
        503,
      );
    }

    const body = await req.json();
    const data = aadhaarOtpInitiateSchema.parse(body);

    const room = await findRoomById(data.roomId);
    if (!room || room.ownerId !== ownerId || room.propertyId !== data.propertyId) {
      return jsonError("Room not found", 404);
    }

    const otp = await generateAadhaarOtp({
      aadhaarNumber: data.aadhaarNumber,
      reason: "Tenant KYC verification",
    });
    const state = generateRandomString(32);

    await createOAuthSession(ownerId, {
      roomId: data.roomId,
      propertyId: data.propertyId,
      role: data.role,
      pkceVerifier: `${aadhaarReference(otp.referenceId)}:${maskAadhaar(data.aadhaarNumber)}`,
      state,
      contactPhone: data.contactPhone,
    });

    return Response.json({ state, message: "OTP sent" });
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Sandbox")) {
      console.error(err);
      return jsonError("KYC provider request failed", 502);
    }
    return handleApiError(err);
  }
}
