import { NextRequest, NextResponse } from "next/server";
import { getOAuthSession, completeOAuthSession } from "@/lib/azure/repos/sessions";
import { exchangeCodeForToken } from "@/lib/digilocker/oauth";
import {
  fetchUserProfile,
  profilePhotoBase64,
  fetchEaadhhaarXml,
} from "@/lib/digilocker/profile";
import { uploadBuffer, getDocsContainer } from "@/lib/azure/blobs";
import { encryptBuffer } from "@/lib/crypto/encrypt";
import { appendConsentLog, getRequestMeta } from "@/lib/consent/log";
import { getDigiLockerConfig } from "@/lib/digilocker/config";

export async function GET(req: NextRequest) {
  const config = getDigiLockerConfig();
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  if (!config) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=digilocker_not_configured`,
    );
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  if (oauthError || !code || !state) {
    return NextResponse.redirect(
      `${baseUrl}/login?error=digilocker_denied`,
    );
  }

  try {
    const session = await getOAuthSession(state);
    if (!session || session.status !== "PENDING") {
      return NextResponse.redirect(
        `${baseUrl}/login?error=invalid_session`,
      );
    }

    const tokens = await exchangeCodeForToken(code, session.pkceVerifier);
    const profile = await fetchUserProfile(tokens.access_token);

    const container = getDocsContainer();
    const photoKey = `persons/pending-${state}/photo.jpg`;
    const photoB64 = profilePhotoBase64(profile);
    if (photoB64) {
      await uploadBuffer(
        container,
        photoKey,
        Buffer.from(photoB64, "base64"),
        "image/jpeg",
      );
    }

    let aadhaarXmlBlobKey: string | undefined;
    const xmlBuffer = await fetchEaadhhaarXml(tokens);
    if (xmlBuffer) {
      aadhaarXmlBlobKey = `persons/pending-${state}/aadhaar.xml.enc`;
      const encrypted = encryptBuffer(xmlBuffer);
      await uploadBuffer(
        container,
        aadhaarXmlBlobKey,
        encrypted,
        "application/octet-stream",
      );
    }

    const meta = getRequestMeta(req.headers);
    await appendConsentLog({
      ownerId: session.ownerId,
      action: "AADHAAR_CONSENT_GIVEN",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
      digilockerRequestId: profile.sub ?? tokens.access_token.slice(0, 16),
      partitionKeyOverride: `PENDING-${state}`,
    });

    const profilePayload = {
      name: profile.name,
      dob: profile.dob,
      gender: profile.gender,
      address: profile.address,
      maskedAadhaar: profile.maskedAadhaar,
      photoBlobKey: photoB64 ? photoKey : "",
      aadhaarXmlBlobKey,
      digilockerSub: profile.sub,
    };

    await completeOAuthSession(
      session.partitionKey,
      session.rowKey,
      profilePayload,
    );

    const redirectUrl = new URL(
      `/properties/${session.propertyId}/rooms/${session.roomId}/add-person`,
      baseUrl,
    );
    redirectUrl.searchParams.set("state", state);
    redirectUrl.searchParams.set("verified", "1");

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("DigiLocker callback error:", err);
    return NextResponse.redirect(
      `${baseUrl}/login?error=digilocker_callback_failed`,
    );
  }
}
