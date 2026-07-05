"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { SagaMark } from "@/components/brand";

// Renders the custom draggable title-bar strip when running inside the Electron
// desktop shell (detected via the preload-exposed `window.desktop`). The OS
// min/maximize/close buttons are drawn by Electron's themed Window Controls
// Overlay on the right; this strip provides the drag region + product name and
// adds `.desktop-chrome` to <html> so the dashboard layout offsets below it.

const emptySubscribe = () => () => {};

function useIsDesktop() {
  // Browser-only flag: server snapshot is false, so the strip renders nothing
  // during SSR and appears after hydration inside the desktop shell.
  return useSyncExternalStore(
    emptySubscribe,
    () =>
      Boolean(
        (window as unknown as { desktop?: { isDesktop?: boolean } }).desktop
          ?.isDesktop,
      ),
    () => false,
  );
}

export function DesktopChrome() {
  const isDesktop = useIsDesktop();
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!isDesktop) return;
    document.documentElement.classList.add("desktop-chrome");
    return () => document.documentElement.classList.remove("desktop-chrome");
  }, [isDesktop]);

  // Keep the native window-controls overlay colored to match the app theme.
  useEffect(() => {
    if (!isDesktop) return;
    const w = window as unknown as {
      desktop?: { setTitleBarTheme?: (isDark: boolean) => void };
    };
    w.desktop?.setTitleBarTheme?.(resolvedTheme === "dark");
  }, [isDesktop, resolvedTheme]);

  if (!isDesktop) return null;

  return (
    <div
      // -webkit-app-region makes the strip draggable to move the window.
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      className="fixed inset-x-0 top-0 z-[100] flex h-[34px] select-none items-center gap-2 border-b border-border bg-background px-3"
    >
      <SagaMark className="size-4" />
      <span className="text-xs font-medium text-muted-foreground">
        Tenant Manager
      </span>
    </div>
  );
}
