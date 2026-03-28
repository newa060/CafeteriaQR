import { NextRequest, NextResponse } from "next/server";
import { decrypt, updateSession, COOKIE_NAMES } from "@/lib/auth";

// Login URLs for each panel
const loginRoutes = ["/customer/login", "/admin/login", "/superadmin/login", "/login"];

// Protected route prefixes and their required roles + login redirect
const protectedPanels = [
  { prefix: "/superadmin", roles: ["superadmin"], loginUrl: "/superadmin/login", cookieName: COOKIE_NAMES.superadmin },
  { prefix: "/admin",      roles: ["admin"],      loginUrl: "/admin/login",      cookieName: COOKIE_NAMES.admin },
  { prefix: "/customer",   roles: ["customer"],   loginUrl: "/customer/login",   cookieName: COOKIE_NAMES.customer },
];

export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 1. Handle Root Path - Direct Redirect based on any existing session
  if (path === "/") {
    let session = null;
    for (const cookieName of Object.values(COOKIE_NAMES)) {
      const cookie = req.cookies.get(cookieName)?.value;
      if (cookie) {
        session = await decrypt(cookie).catch(() => null);
        if (session) break;
      }
    }
    if (session) {
      const role = session.user.role as string;
      if (role === "superadmin") return NextResponse.redirect(new URL("/superadmin", req.nextUrl));
      if (role === "admin")      return NextResponse.redirect(new URL("/admin", req.nextUrl));
      return NextResponse.redirect(new URL("/customer", req.nextUrl));
    }
    // No session? Customer landing is the default "website"
    return NextResponse.redirect(new URL("/customer", req.nextUrl));
  }

  // 2. Handle Login Pages
  if (loginRoutes.some((r) => path === r || path.startsWith(r))) {
    let session = null;
    for (const cookieName of Object.values(COOKIE_NAMES)) {
      const cookie = req.cookies.get(cookieName)?.value;
      if (cookie) {
        session = await decrypt(cookie).catch(() => null);
        if (session) break;
      }
    }

    if (session) {
      const role = session.user.role as string;
      
      // If visiting generic /login, kick to their dashboard
      if (path === "/login") {
        if (role === "superadmin") return NextResponse.redirect(new URL("/superadmin", req.nextUrl));
        if (role === "admin")      return NextResponse.redirect(new URL("/admin", req.nextUrl));
        return NextResponse.redirect(new URL("/customer", req.nextUrl));
      }

      // If visiting THEIR OWN login page, kick to their dashboard
      if (path === "/superadmin/login" && role === "superadmin") return NextResponse.redirect(new URL("/superadmin", req.nextUrl));
      if (path === "/admin/login" && role === "admin") return NextResponse.redirect(new URL("/admin", req.nextUrl));
      if (path === "/customer/login" && role === "customer") return NextResponse.redirect(new URL("/customer", req.nextUrl));

      // ALLOW visiting OTHER login pages (so they can switch accounts)
      return (await updateSession(req)) || NextResponse.next();
    }

    return NextResponse.next();
  }


  // 3. Handle Protected Panels
  const panel = protectedPanels.find((p) => path.startsWith(p.prefix));
  if (!panel) return NextResponse.next();

  // Decrypt session for THIS specific panel
  const cookie = req.cookies.get(panel.cookieName)?.value;
  const session = cookie ? await decrypt(cookie).catch(() => null) : null;

  // Not authenticated for this panel → redirect to its login
  if (!session) {
    return NextResponse.redirect(new URL(panel.loginUrl, req.nextUrl));
  }


  // Final role verification
  const role = session.user.role as string;
  if (!panel.roles.includes(role)) {
    if (role === "superadmin") return NextResponse.redirect(new URL("/superadmin", req.nextUrl));
    if (role === "admin")      return NextResponse.redirect(new URL("/admin", req.nextUrl));
    return NextResponse.redirect(new URL("/customer", req.nextUrl));
  }

  return (await updateSession(req)) || NextResponse.next();
}


// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};


