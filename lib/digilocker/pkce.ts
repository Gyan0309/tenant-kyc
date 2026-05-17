import { createHash, randomBytes } from "crypto";

export function generateRandomString(length: number): string {
  return randomBytes(length)
    .toString("base64url")
    .slice(0, length);
}

export function generateVerifier(): string {
  return generateRandomString(64);
}

export function challengeFromVerifier(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}
