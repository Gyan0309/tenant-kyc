import { completeOAuthSession, getOAuthSession } from "@/lib/azure/repos/sessions";
import { uploadBuffer, getDocsContainer } from "@/lib/azure/blobs";
import { encryptBuffer } from "@/lib/crypto/encrypt";
import { appendConsentLog, getRequestMeta } from "@/lib/consent/log";
import { parseXML } from "@azure/core-xml";
import { sandboxFetch } from "./client";

const AADHAAR_REF_PREFIX = "sandbox-aadhaar:";
const DIGILOCKER_SESSION_PREFIX = "sandbox-digilocker:";
const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;

interface SandboxEnvelope<T> {
  data?: T;
  transaction_id?: string;
}

interface AadhaarOtpData {
  reference_id?: string | number;
  message?: string;
}

interface AadhaarOkData {
  reference_id?: string | number;
  status?: string;
  name?: string;
  date_of_birth?: string;
  gender?: string;
  full_address?: string;
  photo?: string;
  mobile?: string;
  phone?: string;
  phone_number?: string;
  mobile_number?: string;
  contact_number?: string;
}

interface DigiLockerSessionData {
  authorization_url?: string;
  session_id?: string;
}

interface DigiLockerStatusData {
  status?: string;
}

interface DigiLockerProfileData {
  id?: string;
  name?: string;
  date_of_birth?: string;
  gender?: string;
  eaadhaar?: boolean;
  mobile?: string;
  phone?: string;
  phone_number?: string;
  mobile_number?: string;
  contact_number?: string;
}

interface DigiLockerDocumentData {
  files?: Array<{
    url?: string;
    metadata?: {
      ContentType?: string;
      description?: string;
    };
  }>;
}

export function aadhaarReference(value: string): string {
  return `${AADHAAR_REF_PREFIX}${value}`;
}

export function digilockerSessionReference(value: string): string {
  return `${DIGILOCKER_SESSION_PREFIX}${value}`;
}

export function readAadhaarReference(value: string): string | null {
  return value.startsWith(AADHAAR_REF_PREFIX)
    ? value.slice(AADHAAR_REF_PREFIX.length)
    : null;
}

export function readDigilockerSessionReference(value: string): string | null {
  return value.startsWith(DIGILOCKER_SESSION_PREFIX)
    ? value.slice(DIGILOCKER_SESSION_PREFIX.length)
    : null;
}

export function maskAadhaar(aadhaarNumber: string): string {
  return `XXXX-XXXX-${aadhaarNumber.replace(/\D/g, "").slice(-4)}`;
}

export async function generateAadhaarOtp(input: {
  aadhaarNumber: string;
  reason: string;
}): Promise<{ referenceId: string; transactionId: string }> {
  const response = await sandboxFetch<SandboxEnvelope<AadhaarOtpData>>(
    "/kyc/aadhaar/okyc/otp",
    {
      method: "POST",
      body: JSON.stringify({
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.otp.request",
        aadhaar_number: input.aadhaarNumber,
        consent: "y",
        reason: input.reason,
      }),
    },
  );
  const referenceId = response.data?.reference_id?.toString();
  if (!referenceId) throw new Error("Sandbox did not return an Aadhaar reference id");

  return {
    referenceId,
    transactionId: response.transaction_id ?? referenceId,
  };
}

export async function verifyAadhaarOtp(input: {
  referenceId: string;
  otp: string;
  maskedAadhaar: string;
  state: string;
  headers: Headers;
}): Promise<void> {
  const response = await sandboxFetch<SandboxEnvelope<AadhaarOkData>>(
    "/kyc/aadhaar/okyc/otp/verify",
    {
      method: "POST",
      body: JSON.stringify({
        "@entity": "in.co.sandbox.kyc.aadhaar.okyc.request",
        reference_id: input.referenceId,
        otp: input.otp,
      }),
    },
  );

  const data = response.data;
  if (!data || data.status?.toUpperCase() !== "VALID") {
    throw new Error("Aadhaar verification failed");
  }

  const session = await getOAuthSession(input.state);
  if (!session || session.status !== "PENDING") throw new Error("invalid_session");

  const photoBlobKey = await uploadPhotoIfPresent(input.state, data.photo);
  await completeOAuthSession(session.partitionKey, session.rowKey, {
    name: data.name ?? "",
    dob: data.date_of_birth ?? "",
    gender: data.gender ?? "",
    address: data.full_address ?? "",
    maskedAadhaar: input.maskedAadhaar,
    phone: pickPhone(data as Record<string, unknown>) || session.contactPhone || "",
    photoBlobKey,
    digilockerSub: response.transaction_id ?? input.referenceId,
  });

  const meta = getRequestMeta(input.headers);
  await appendConsentLog({
    ownerId: session.ownerId,
    action: "AADHAAR_CONSENT_GIVEN",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    digilockerRequestId: response.transaction_id ?? input.referenceId,
    partitionKeyOverride: `PENDING-${input.state}`,
  });
}

export async function initiateSandboxDigiLocker(input: {
  redirectUrl: string;
  verifiedMobile?: string;
}): Promise<{ authUrl: string; sessionId: string; transactionId: string }> {
  const options: Record<string, unknown> = {
    verification_method: ["aadhaar"],
    pinless: true,
    usernameless: true,
  };
  if (input.verifiedMobile) options.verified_mobile = input.verifiedMobile;

  const response = await sandboxFetch<SandboxEnvelope<DigiLockerSessionData>>(
    "/kyc/digilocker/sessions/init",
    {
      method: "POST",
      body: JSON.stringify({
        "@entity": "in.co.sandbox.kyc.digilocker.session.request",
        flow: "signin",
        redirect_url: input.redirectUrl,
        doc_types: ["aadhaar"],
        options,
      }),
    },
  );

  const authUrl = response.data?.authorization_url;
  const sessionId = response.data?.session_id;
  if (!authUrl || !sessionId) {
    throw new Error("Sandbox did not return a DigiLocker authorization URL");
  }

  return {
    authUrl,
    sessionId,
    transactionId: response.transaction_id ?? sessionId,
  };
}

export async function completeSandboxDigiLockerIfReady(input: {
  state: string;
  sessionId: string;
  headers: Headers;
}): Promise<boolean> {
  const statusResponse = await sandboxFetch<SandboxEnvelope<DigiLockerStatusData>>(
    `/kyc/digilocker/sessions/${encodeURIComponent(input.sessionId)}/status`,
  );
  const normalized = statusResponse.data?.status?.toLowerCase() ?? "";
  if (
    ![
      "completed",
      "complete",
      "success",
      "succeeded",
      "consented",
      "approved",
      "authorized",
      "authenticated",
      "consent_received",
    ].includes(normalized)
  ) {
    return false;
  }

  const session = await getOAuthSession(input.state);
  if (!session || session.status !== "PENDING") return false;

  const profileResponse = await sandboxFetch<SandboxEnvelope<DigiLockerProfileData>>(
    `/kyc/digilocker/sessions/${encodeURIComponent(input.sessionId)}/user/profile`,
  );
  const aadhaarDocument = await fetchAndStoreAadhaarDocument(
    input.state,
    input.sessionId,
  );
  const profile = {
    name: profileResponse.data?.name ?? aadhaarDocument.profile.name,
    dob: profileResponse.data?.date_of_birth ?? aadhaarDocument.profile.dob,
    gender: profileResponse.data?.gender ?? aadhaarDocument.profile.gender,
    address: aadhaarDocument.profile.address,
    maskedAadhaar: aadhaarDocument.profile.maskedAadhaar,
    phone:
      pickPhone(profileResponse.data as Record<string, unknown> | undefined) ||
      session.contactPhone ||
      "",
  };

  await completeOAuthSession(session.partitionKey, session.rowKey, {
    ...profile,
    photoBlobKey: aadhaarDocument.photoBlobKey,
    aadhaarXmlBlobKey: aadhaarDocument.aadhaarXmlBlobKey,
    digilockerSub: profileResponse.data?.id ?? input.sessionId,
  });

  const meta = getRequestMeta(input.headers);
  await appendConsentLog({
    ownerId: session.ownerId,
    action: "AADHAAR_CONSENT_GIVEN",
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
    digilockerRequestId: profileResponse.data?.id ?? input.sessionId,
    partitionKeyOverride: `PENDING-${input.state}`,
  });

  return true;
}

async function uploadPhotoIfPresent(
  state: string,
  photo?: string,
): Promise<string> {
  const base64 = extractBase64(photo);
  if (!base64) return "";

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > MAX_DOCUMENT_BYTES) return "";

  const photoKey = `persons/pending-${state}/photo.jpg`;
  await uploadBuffer(getDocsContainer(), photoKey, buffer, "image/jpeg");
  return photoKey;
}

async function fetchAndStoreAadhaarDocument(
  state: string,
  sessionId: string,
): Promise<{
  aadhaarXmlBlobKey?: string;
  photoBlobKey: string;
  profile: {
    name: string;
    dob: string;
    gender: string;
    address: string;
    maskedAadhaar: string;
  };
}> {
  const documentResponse = await fetchDigiLockerDocument(sessionId);
  const file = documentResponse.data?.files?.find((item) => {
    const contentType = item.metadata?.ContentType?.toLowerCase() ?? "";
    const description = item.metadata?.description?.toLowerCase() ?? "";
    return contentType.includes("xml") || description.includes("xml");
  });
  const empty = {
    photoBlobKey: "",
    profile: { name: "", dob: "", gender: "", address: "", maskedAadhaar: "" },
  };
  if (!file?.url) return empty;

  const url = new URL(file.url);
  if (url.protocol !== "https:") return empty;

  const response = await fetch(url.toString(), { cache: "no-store" });
  if (!response.ok) return empty;

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > MAX_DOCUMENT_BYTES) return empty;

  const xmlText = bytes.toString("utf8");
  const parsed = await parseAadhaarXml(xmlText);
  const blobKey = `persons/pending-${state}/aadhaar.xml.enc`;
  await uploadBuffer(
    getDocsContainer(),
    blobKey,
    encryptBuffer(bytes),
    "application/octet-stream",
  );
  const photoBlobKey = await uploadPhotoIfPresent(state, parsed.photo);
  return {
    aadhaarXmlBlobKey: blobKey,
    photoBlobKey,
    profile: parsed,
  };
}

function extractBase64(value?: string): string | null {
  if (!value) return null;
  if (value.startsWith("data:")) return value.split(",")[1] ?? null;
  return value;
}

async function fetchDigiLockerDocument(
  sessionId: string,
): Promise<SandboxEnvelope<DigiLockerDocumentData>> {
  const encoded = encodeURIComponent(sessionId);
  try {
    return await sandboxFetch<SandboxEnvelope<DigiLockerDocumentData>>(
      `/kyc/digilocker/sessions/${encoded}/documents/ADHAR`,
    );
  } catch {
    return sandboxFetch<SandboxEnvelope<DigiLockerDocumentData>>(
      `/kyc/digilocker/sessions/${encoded}/documents/aadhaar`,
    );
  }
}

function pickPhone(data?: Record<string, unknown> | null): string {
  if (!data) return "";
  for (const key of [
    "mobile",
    "phone",
    "phone_number",
    "mobile_number",
    "contact_number",
  ]) {
    const value = data[key];
    if (typeof value === "string" && /^\d{10}$/.test(value)) return value;
  }
  return "";
}

async function parseAadhaarXml(xml: string): Promise<{
  name: string;
  dob: string;
  gender: string;
  address: string;
  maskedAadhaar: string;
  photo?: string;
}> {
  const parsed = await parseXML(xml, { includeRoot: true });
  const poi = findFirstNode(parsed, "Poi");
  const poa = findFirstNode(parsed, "Poa");
  const uidData = findFirstNode(parsed, "UidData");
  const photo = findText(findFirstNode(parsed, "Pht"));
  const uid = readAttr(uidData, "uid");
  const addressParts = [
    "house",
    "street",
    "loc",
    "vtc",
    "dist",
    "state",
    "pc",
  ]
    .map((key) => readAttr(poa, key))
    .filter(Boolean);

  return {
    name: readAttr(poi, "name"),
    dob: readAttr(poi, "dob"),
    gender: readAttr(poi, "gender"),
    address: addressParts.join(", "),
    maskedAadhaar: uid ? `XXXX-XXXX-${uid.slice(-4)}` : "",
    photo,
  };
}

function findFirstNode(value: unknown, nodeName: string): unknown {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  if (nodeName in record) return record[nodeName];
  for (const child of Object.values(record)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const found = findFirstNode(item, nodeName);
        if (found) return found;
      }
    } else {
      const found = findFirstNode(child, nodeName);
      if (found) return found;
    }
  }
  return undefined;
}

function readAttr(node: unknown, attrName: string): string {
  if (!node || typeof node !== "object") return "";
  const attrs = (node as Record<string, unknown>).$;
  if (!attrs || typeof attrs !== "object") return "";
  const value = (attrs as Record<string, unknown>)[attrName];
  return typeof value === "string" ? value : "";
}

function findText(node: unknown): string {
  if (typeof node === "string") return node;
  if (!node || typeof node !== "object") return "";
  const text = (node as Record<string, unknown>)._;
  return typeof text === "string" ? text : "";
}
