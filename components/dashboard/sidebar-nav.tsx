"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Home, LogOut, Shield } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
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
  { href: "/dashboard/properties/new", label: "Add Property", icon: Building2 },
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
      <Sidebar className="border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <SidebarHeader className="border-b border-slate-100 dark:border-slate-800 px-6 py-4.5 flex flex-row items-center gap-3">
          <Shield className="stroke-indigo-600 fill-none size-5.5 stroke-[2]" />
          <div>
            <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight leading-none block">TenantManager</span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mt-0.5">Management Suite</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider px-3 mb-2">
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
                        <div className="absolute left-1 w-1 h-6 bg-indigo-600 rounded-full z-10" />
                      )}
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={isActive}
                        className={cn(
                          "w-full flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-slate-100 text-slate-900 font-semibold dark:bg-slate-900 dark:text-slate-100 shadow-none"
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-200"
                        )}
                      >
                        <item.icon className="size-4 flex-shrink-0" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-slate-100 dark:border-slate-800 p-4 space-y-4">
          {user && (
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="size-9 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center text-xs font-bold shadow-xs">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">{user.email}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-red-400 hover:text-red-600 px-3 transition-colors text-xs font-semibold"
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
          >
            <LogOut className="size-4 mr-2" />
            Sign out
          </Button>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="bg-slate-50/50 dark:bg-slate-900/50">
        <header className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors" />
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Session: <span className="font-semibold text-slate-700 dark:text-slate-300">{user?.name || "Manager"}</span>
            </span>
          </div>
          <div className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            V1.0.0
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
