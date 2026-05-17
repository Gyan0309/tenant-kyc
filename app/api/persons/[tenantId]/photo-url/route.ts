import { NextRequest } from "next/server";
import { requireOwner } from "@/lib/auth/session";
import { handleApiError, jsonError } from "@/lib/api/errors";
import { findPersonById } from "@/lib/azure/repos/persons";
import { generateReadSasUrl, getDocsContainer } from "@/lib/azure/blobs";

type Params = { params: Promise<{ tenantId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { error, ownerId } = await requireOwner();
    if (error) return error;
    const { tenantId } = await params;

    const person = await findPersonById(tenantId);
    if (!person || person.ownerId !== ownerId || !person.photoBlobKey) {
      return jsonError("Photo not found", 404);
    }

    const url = generateReadSasUrl(
      getDocsContainer(),
      person.photoBlobKey,
      60,
    );

    return Response.json({ url, expiresInMinutes: 60 });
  } catch (err) {
    return handleApiError(err);
  }
}
