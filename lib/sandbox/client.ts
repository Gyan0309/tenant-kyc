import { requireSandboxConfig } from "./config";

interface SandboxAuthResponse {
  data?: {
    access_token?: string;
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const config = requireSandboxConfig();
  const response = await fetch(`${config.baseUrl}/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
      "x-api-secret": config.apiSecret,
      "x-api-version": config.apiVersion,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sandbox authentication failed: ${response.status} ${text}`);
  }

  const body = (await response.json()) as SandboxAuthResponse;
  const token = body.data?.access_token;
  if (!token) throw new Error("Sandbox authentication did not return a token");

  cachedToken = {
    token,
    expiresAt: Date.now() + 23 * 60 * 60 * 1000,
  };
  return token;
}

export async function sandboxFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const config = requireSandboxConfig();
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("authorization", token);
  headers.set("x-api-key", config.apiKey);
  headers.set("x-api-version", config.apiVersion);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sandbox request failed: ${response.status} ${text}`);
  }

  return response.json() as Promise<T>;
}
