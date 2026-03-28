import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/auth";

// 1. Specify protected and public routes
const protectedRoutes = ["/admin", "/superadmin", "/customer"];
const publicRoutes = ["/login", "/api/auth"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => path.startsWith(route));

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get("session")?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // 5. Check roles for protected routes
  if (session && isProtectedRoute) {
    const role = session.user.role;

    if (path.startsWith("/superadmin") && role !== "superadmin") {
      return NextResponse.redirect(new URL("/login", req.nextUrl));
    }

    if (path.startsWith("/admin") && role !== "admin" && role !== "superadmin") {
      return NextResponse.redirect(new URL("/customer", req.nextUrl));
    }
  }

  // 6. Redirect to /dashboard if the user is authenticated
  if (
    isPublicRoute &&
    session &&
    !path.startsWith("/api/auth") &&
    !path.startsWith("/api/auth/logout")
  ) {
    const role = session.user.role;
    if (role === "superadmin") {
      return NextResponse.redirect(new URL("/superadmin", req.nextUrl));
    } else if (role === "admin") {
      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    } else {
      return NextResponse.redirect(new URL("/customer", req.nextUrl));
    }
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
