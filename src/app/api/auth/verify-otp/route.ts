import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OTP from "@/models/OTP";
import User from "@/models/User";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, otp, name } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    // Find the OTP entry in the database
    const otpEntry = await OTP.findOne({ email, otp, used: false });

    if (!otpEntry) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Check if the OTP is expired
    if (new Date() > otpEntry.expiresAt) {
      return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    }

    // Mark the OTP as used
    otpEntry.used = true;
    await otpEntry.save();

    // Check if the user exists
    let user = await User.findOne({ email });

    // If the user doesn't exist, create a new one (as customer)
    if (!user) {
      if (!name) {
        return NextResponse.json({ error: "Name is required for new users" }, { status: 400 });
      }
      user = await User.create({ name, email, role: "customer" });
    }

    // Create session cookie
    await login(user);

    return NextResponse.json({ message: "OTP verified successfully", user: user.toObject() }, { status: 200 });
  } catch (error: any) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
