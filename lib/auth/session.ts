import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export async function getOwnerSession() {
  return auth();
}

export async function requireOwner() {
  const session = await auth();
  const ownerId = session?.user?.id;
  if (!ownerId) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      ownerId: null as never,
      session: null,
    };
  }
  return { error: null, ownerId, session };
}
