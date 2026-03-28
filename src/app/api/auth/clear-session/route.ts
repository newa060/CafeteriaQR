import { NextResponse } from "next/server";

// Simple GET endpoint to clear the session cookie and redirect to /login.
// No database required - just clears the JWT cookie.
export async function GET() {
  const response = NextResponse.redirect(
    new URL("/login", "http://localhost:3000")
  );
  // Clear the session cookie
  response.cookies.set("session", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
  });
  return response;
}
