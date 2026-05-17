import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { digilockerInitiateSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { getDigiLockerConfig } from "@/lib/digilocker/config";
import { generateVerifier, challengeFromVerifier, generateRandomString } from "@/lib/digilocker/pkce";
import { buildAuthorizeUrl } from "@/lib/digilocker/oauth";
import { createOAuthSession } from "@/lib/azure/repos/sessions";
import { findRoomById } from "@/lib/azure/repos/rooms";

export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    if (!getDigiLockerConfig()) {
      return jsonError(
        "DigiLocker is not configured. See docs/digilocker-integration.md",
        503,
      );
    }

    const body = await req.json();
    const data = digilockerInitiateSchema.parse(body);

    const room = await findRoomById(data.roomId);
    if (!room || room.ownerId !== ownerId || room.propertyId !== data.propertyId) {
      return jsonError("Room not found", 404);
    }

    const pkceVerifier = generateVerifier();
    const codeChallenge = challengeFromVerifier(pkceVerifier);
    const state = generateRandomString(32);

    await createOAuthSession(ownerId, {
      roomId: data.roomId,
      propertyId: data.propertyId,
      role: data.role,
      pkceVerifier,
      state,
    });

    const authUrl = buildAuthorizeUrl(state, codeChallenge);

    return Response.json({ authUrl, state });
  } catch (err) {
    return handleApiError(err);
  }
}
