import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OTP from "@/models/OTP";
import { sendOTPEmail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Generate a 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Upsert the OTP in the database
    await OTP.findOneAndUpdate(
      { email },
      { otp: otpCode, expiresAt, used: false },
      { upsert: true, new: true }
    );

    // Send the OTP via email
    await sendOTPEmail(email, otpCode);

    return NextResponse.json({ message: "OTP sent successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("Error in send-otp API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
