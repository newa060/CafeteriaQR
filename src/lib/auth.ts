import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const secretKey = "secret";
const key = new TextEncoder().encode(process.env.JWT_SECRET || secretKey);

type EncryptPayload = Record<string, unknown>;
type SessionPayload = { user: { id: string; _id?: string; email: string; name: string; role: string; cafeteriaId?: string; faculty?: string }; expires: Date };
type LoginUser = { _id?: { toString(): string }; id?: string; email: string; name: string; role: string; cafeteriaId?: { toString(): string }; faculty?: string };

export async function encrypt(payload: EncryptPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as unknown as SessionPayload;
}

// Isolated cookie names for each role to prevent cross-session issues
export const COOKIE_NAMES: Record<string, string> = {
  superadmin: "session_superadmin",
  admin: "session_admin",
  customer: "session_customer",
};

export async function login(user: LoginUser) {
  // Extract serializable fields
  const userPayload = {
    id: user._id?.toString() || user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    cafeteriaId: user.cafeteriaId?.toString(),
    faculty: user.faculty,
  };

  const role = user.role as string;
  const cookieName = COOKIE_NAMES[role] || "session_customer";

  // Create the session - 30 days as requested (Strong persistence)
  const duration = 365 * 24 * 60 * 60 * 1000;
  const expires = new Date(Date.now() + duration);
  const session = await encrypt({ user: userPayload, expires });

  const cookieStore = await cookies();
  
  // Save the new session
  cookieStore.set(cookieName, session, { 
    expires, 
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}


export async function logout(role?: string) {
  if (role && COOKIE_NAMES[role]) {
    // Destroy specific session
    (await cookies()).set(COOKIE_NAMES[role], "", { 
      expires: new Date(0),
      path: "/",
    });
  } else {
    // Destroy all possible session cookies
    const cookieStore = await cookies();
    Object.values(COOKIE_NAMES).forEach((name) => {
      cookieStore.set(name, "", { expires: new Date(0), path: "/" });
    });
  }
}

export async function getSession(role?: string) {
  const cookieStore = await cookies();
  
  if (role && COOKIE_NAMES[role]) {
    const sessionCookie = cookieStore.get(COOKIE_NAMES[role])?.value;
    if (!sessionCookie) return null;
    return await decrypt(sessionCookie).catch(() => null);
  }

  // Fallback: check all valid session cookies in order of priority
  for (const name of Object.values(COOKIE_NAMES)) {
    const rawValue = cookieStore.get(name)?.value;
    if (rawValue) {
      const decoded = await decrypt(rawValue).catch(() => null);
      if (decoded) return decoded;
    }
  }
  
  return null;
}


export async function updateSession(request: NextRequest) {
  // Determine role based on path
  const path = request.nextUrl.pathname;
  let role = "customer";
  if (path.startsWith("/superadmin")) role = "superadmin";
  else if (path.startsWith("/admin")) role = "admin";

  const cookieName = COOKIE_NAMES[role];
  const cookieValue = request.cookies.get(cookieName)?.value;
  if (!cookieValue) return null;

  try {
    // Extend the session by another 30 days
    const parsed = await decrypt(cookieValue);
    const duration = 365 * 24 * 60 * 60 * 1000;
    parsed.expires = new Date(Date.now() + duration);
    
    const res = NextResponse.next();
    
    // Standard cookie setting syntax: (name, value, options)
    res.cookies.set(cookieName, await encrypt(parsed), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: parsed.expires,
    });
    
    return res;
  } catch (error) {
    console.error("Session refresh failed:", error);
    return null;
  }
}




