"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { SagaLogo } from "@/components/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Properties", icon: Home },
  // { href: "/dashboard/properties/new", label: "Add Property", icon: Building2 },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;

  // Get initials for avatar display
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  return (
    <SidebarProvider>
      <Sidebar className="border-r border-border bg-card">
        <SidebarHeader className="flex flex-row items-center border-b border-border px-5 py-4">
          <SagaLogo subtitle="Property Suite" />
        </SidebarHeader>
        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname.startsWith(item.href);
                  return (
                    <SidebarMenuItem key={item.href} className="relative flex items-center">
                      {isActive && (
                        <div className="absolute left-0 z-10 h-5 w-0.5 rounded-full bg-brand" />
                      )}
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                          isActive
                            ? "bg-accent text-foreground"
                            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("size-4 flex-shrink-0", isActive && "text-brand")} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="space-y-3 border-t border-border p-3">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
          >
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-background">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-muted-foreground transition-colors hover:text-foreground" />
            <div className="h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{user?.name || "Manager"}</span>
            </span>
          </div>
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            v1.0.0
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-6 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
