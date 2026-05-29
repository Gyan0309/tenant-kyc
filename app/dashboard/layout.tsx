import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/sidebar-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
