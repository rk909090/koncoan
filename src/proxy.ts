import { NextResponse, type NextRequest } from "next/server";

/**
 * Pengecekan optimistis untuk /admin: tanpa cookie sesi → langsung ke halaman login.
 * Validasi sesi yang sebenarnya (ke database) tetap dilakukan di server
 * (requireUser) pada setiap halaman & Server Action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();
  if (!request.cookies.has("koncoan_admin")) {
    const url = new URL("/admin/login", request.url);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
