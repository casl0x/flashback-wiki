import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get("admin_auth");

  if (req.nextUrl.pathname.startsWith("/admin")) {
    // Laisser passer la page login
    if (req.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }

    // Vérifier le cookie
    if (cookie?.value !== process.env.ADMIN_SECRET) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
