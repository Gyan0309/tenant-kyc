import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { createManualTenantSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { createTenantFromManualUpload } from "@/lib/tenants/create";
import { PdfPasswordError } from "@/lib/pdf/decrypt";
import { appendConsentLog, getRequestMeta } from "@/lib/consent/log";

export async function POST(req: NextRequest) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;

    const formData = await req.formData();
    const role = stringValue(formData, "role") || "PRIMARY";

    // Aadhaar is required only for the primary tenant; optional for roommates
    // and family members.
    const rawAadhaar = formData.get("aadhaarFile");
    const aadhaarFile =
      rawAadhaar instanceof File && rawAadhaar.size > 0 ? rawAadhaar : null;

    if (role === "PRIMARY" && !aadhaarFile) {
      return jsonError("Aadhaar document is required for the primary tenant", 400);
    }
    if (aadhaarFile) {
      if (aadhaarFile.size > 4 * 1024 * 1024) {
        return jsonError("Aadhaar document must be 4MB or smaller", 400);
      }
      if (!isAllowedDocumentType(aadhaarFile)) {
        return jsonError("Aadhaar document must be a PDF or image", 400);
      }
    }

    // Optional tenant photo (optimized server-side before storage).
    const rawPhoto = formData.get("photoFile");
    const photoFile =
      rawPhoto instanceof File && rawPhoto.size > 0 ? rawPhoto : null;
    if (photoFile) {
      if (photoFile.size > 8 * 1024 * 1024) {
        return jsonError("Photo must be 8MB or smaller", 400);
      }
      if (!photoFile.type.toLowerCase().startsWith("image/")) {
        return jsonError("Photo must be an image", 400);
      }
    }

    const data = createManualTenantSchema.parse({
      roomId: stringValue(formData, "roomId"),
      propertyId: stringValue(formData, "propertyId"),
      role,
      relation: optionalStringValue(formData, "relation"),
      name: stringValue(formData, "name"),
      dob: optionalStringValue(formData, "dob"),
      gender: optionalStringValue(formData, "gender"),
      phone: stringValue(formData, "phone"),
      address: optionalStringValue(formData, "address"),
      aadhaarLast4: optionalStringValue(formData, "aadhaarLast4"),
      aadhaarPassword: optionalStringValue(formData, "aadhaarPassword"),
      moveInDate: optionalStringValue(formData, "moveInDate"),
      emergencyContact: optionalStringValue(formData, "emergencyContact"),
      documentConsent: stringValue(formData, "documentConsent") === "true",
    });

    const { person } = await createTenantFromManualUpload({
      ownerId,
      ...data,
      aadhaarFile,
      photoFile,
    });

    const meta = getRequestMeta(req.headers);
    await appendConsentLog({
      personId: person.rowKey,
      ownerId,
      action: "DOCUMENT_UPLOADED",
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    });

    return Response.json({
      id: person.rowKey,
      name: person.name,
      isVerified: person.isVerified,
    });
  } catch (err) {
    if (err instanceof PdfPasswordError) {
      return jsonError(err.message, 400);
    }
    if (err instanceof Error && err.message.includes("not found")) {
      return jsonError(err.message, 404);
    }
    return handleApiError(err);
  }
}

function stringValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function optionalStringValue(formData: FormData, key: string): string | undefined {
  const value = stringValue(formData, key);
  return value || undefined;
}

function isAllowedDocumentType(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type.startsWith("image/") ||
    type === "application/pdf" ||
    /\.(png|jpe?g|webp|pdf)$/.test(name)
  );
}
