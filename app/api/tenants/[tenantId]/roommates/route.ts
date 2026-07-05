import { jsonError } from "@/lib/api/errors";

export async function POST() {
  return jsonError(
    "Roommates are added through POST /api/tenants with a manual Aadhaar document upload.",
    410,
  );
}
