const AUTHORIZE_URL =
  "https://digilocker.meripehchaan.gov.in/public/oauth2/1/authorize";
const TOKEN_URL =
  "https://digilocker.meripehchaan.gov.in/public/oauth2/2/token";
const USERINFO_URL =
  "https://digilocker.meripehchaan.gov.in/public/oauth2/3/userinfo";

export function getDigiLockerConfig() {
  const clientId = process.env.DIGILOCKER_CLIENT_ID || "";
  const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET || "";
  const redirectUri = process.env.DIGILOCKER_REDIRECT_URI || "";

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    authorizeUrl: AUTHORIZE_URL,
    tokenUrl: TOKEN_URL,
    userinfoUrl: USERINFO_URL,
    scopes: "openid profile aadhaar_address",
  };
}

export function requireDigiLockerConfig() {
  const config = getDigiLockerConfig();
  if (!config) {
    throw new Error(
      "DigiLocker is not configured. Set DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET, and DIGILOCKER_REDIRECT_URI. See docs/digilocker-integration.md",
    );
  }
  return config;
}
