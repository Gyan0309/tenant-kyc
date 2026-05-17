import { TenantDetailClient } from "@/components/tenant-detail-client";

export default async function TenantPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  return <TenantDetailClient tenantId={tenantId} />;
}
