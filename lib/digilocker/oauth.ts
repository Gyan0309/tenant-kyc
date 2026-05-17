import { requireDigiLockerConfig } from "./config";
import { challengeFromVerifier } from "./pkce";

export function buildAuthorizeUrl(
  state: string,
  codeChallenge: string,
): string {
  const config = requireDigiLockerConfig();
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${config.authorizeUrl}?${params.toString()}`;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
}

export async function exchangeCodeForToken(
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const config = requireDigiLockerConfig();
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code_verifier: codeVerifier,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`DigiLocker token exchange failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<TokenResponse>;
}
