import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    const userRole = token?.role as string | undefined;

    // RBAC: Admin routes
    if (pathname.includes("/admin") && userRole !== "SYSTEM_ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // RBAC: Dashboard (Executive view for Foreign Partners & Admins)
    if (
      pathname.includes("/dashboard") &&
      userRole !== "FOREIGN_PARTNER" &&
      userRole !== "SYSTEM_ADMIN"
    ) {
      if (userRole === "LOCAL_MANAGER") {
        return NextResponse.redirect(new URL("/uz/field", req.url));
      }
    }

    // RBAC: Field Report Form (Field view for Local Managers & Admins)
    if (
      pathname.includes("/field") &&
      userRole !== "LOCAL_MANAGER" &&
      userRole !== "SYSTEM_ADMIN"
    ) {
      if (userRole === "FOREIGN_PARTNER") {
        return NextResponse.redirect(new URL("/zh/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/(uz|ru|en|zh)/:path*",
    "/contacts",
    "/contacts/:path*",
  ],
};
