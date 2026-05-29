export interface SandboxConfig {
  apiKey: string;
  apiSecret: string;
  apiVersion: string;
  baseUrl: string;
}

export function getSandboxConfig(): SandboxConfig | null {
  const apiKey = process.env.SANDBOX_API_KEY ?? "";
  const apiSecret = process.env.SANDBOX_API_SECRET ?? "";
  const apiVersion = process.env.SANDBOX_API_VERSION ?? "1.0.0";
  const baseUrl =
    process.env.SANDBOX_BASE_URL ?? "https://test-api.sandbox.co.in";

  if (!apiKey || !apiSecret) return null;

  const usesTestApi = baseUrl.includes("test-api.sandbox.co.in");
  if (usesTestApi && apiKey.startsWith("key_live_")) {
    throw new Error(
      "Sandbox KYC is misconfigured: use a test API key with test-api.sandbox.co.in or switch SANDBOX_BASE_URL to https://api.sandbox.co.in.",
    );
  }
  if (!usesTestApi && apiKey.startsWith("key_test_")) {
    throw new Error(
      "Sandbox KYC is misconfigured: use a live API key with api.sandbox.co.in or switch SANDBOX_BASE_URL to https://test-api.sandbox.co.in.",
    );
  }

  return {
    apiKey,
    apiSecret,
    apiVersion,
    baseUrl: baseUrl.replace(/\/$/, ""),
  };
}

export function requireSandboxConfig(): SandboxConfig {
  const config = getSandboxConfig();
  if (!config) {
    throw new Error(
      "Sandbox KYC is not configured. Set SANDBOX_API_KEY and SANDBOX_API_SECRET.",
    );
  }
  return config;
}
