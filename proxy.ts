import { auth } from "@/lib/auth/config";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isPublicApi =
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/owners") ||
    pathname.startsWith("/api/verify/digilocker/callback");

  if (isPublicApi) return NextResponse.next();

  const isDashboard =
    !pathname.startsWith("/api") &&
    !isAuthPage &&
    pathname !== "/" &&
    !pathname.startsWith("/_next");

  if (isDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/api") && !isPublicApi && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
