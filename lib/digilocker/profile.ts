import { requireDigiLockerConfig } from "./config";
import type { TokenResponse } from "./oauth";

export interface DigiLockerUserProfile {
  sub?: string;
  name: string;
  dob: string;
  gender: string;
  address: string;
  maskedAadhaar: string;
  photo?: string;
  picture?: string;
}

function pickString(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const val = obj[key];
    if (typeof val === "string" && val) return val;
  }
  return "";
}

export async function fetchUserProfile(
  accessToken: string,
): Promise<DigiLockerUserProfile> {
  const config = requireDigiLockerConfig();
  const response = await fetch(config.userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DigiLocker userinfo failed: ${response.status} ${text}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    sub: pickString(data, "sub", "digilockerid"),
    name: pickString(data, "name", "given_name"),
    dob: pickString(data, "dob", "birthdate"),
    gender: pickString(data, "gender"),
    address: pickString(data, "address", "aadhaar_address"),
    maskedAadhaar: pickString(
      data,
      "masked_aadhaar",
      "maskedAadhaar",
      "aadhaar",
    ),
    photo: pickString(data, "photo", "picture"),
    picture: pickString(data, "picture", "photo"),
  };
}

export function profilePhotoBase64(profile: DigiLockerUserProfile): string | null {
  const raw = profile.photo ?? profile.picture;
  if (!raw) return null;
  if (raw.startsWith("data:")) {
    return raw.split(",")[1] ?? null;
  }
  return raw;
}

export async function fetchEaadhhaarXml(
  _tokens: TokenResponse,
): Promise<Buffer | null> {
  // Partner-specific issued document API — implement when scope/doc URI is approved
  return null;
}
