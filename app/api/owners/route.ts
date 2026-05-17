import { NextRequest } from "next/server";
import { createOwner } from "@/lib/azure/repos/owners";
import { registerOwnerSchema } from "@/lib/types/validation";
import { handleApiError, jsonError } from "@/lib/api/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerOwnerSchema.parse(body);

    const owner = await createOwner(data.name, data.email, data.password);

    return Response.json({
      id: owner.rowKey,
      name: owner.name,
      email: owner.email,
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("EntityAlreadyExists")) {
      return jsonError("Email already registered", 409);
    }
    return handleApiError(err);
  }
}
