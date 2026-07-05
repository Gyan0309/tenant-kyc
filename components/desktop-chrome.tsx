"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

// Headless helper for the Electron desktop shell. It renders nothing visible —
// there is no separate title-bar strip. It just (1) adds `.desktop-chrome` to
// <html> so the app's own top bar becomes the window drag region, and (2) keeps
// the native window-controls overlay colored to match the app theme.

const emptySubscribe = () => () => {};

function useIsDesktop() {
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

  useEffect(() => {
    if (!isDesktop) return;
    const w = window as unknown as {
      desktop?: { setTitleBarTheme?: (isDark: boolean) => void };
    };
    w.desktop?.setTitleBarTheme?.(resolvedTheme === "dark");
  }, [isDesktop, resolvedTheme]);

  return null;
}
