import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { role } = await req.json().catch(() => ({ role: undefined }));
    await logout(role);
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    await logout(); // Fallback to clear all if something goes wrong
    return NextResponse.json({ message: "Logged out with fallback settings" });
  }
}
