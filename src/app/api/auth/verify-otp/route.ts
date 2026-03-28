import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import OTP from "@/models/OTP";
import User from "@/models/User";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { email, otp, name, loginPanel } = await req.json();

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

    if (loginPanel === "superadmin") {
      // Only the configured SUPERADMIN_EMAIL may log in here
      const superadminEmail = process.env.SUPERADMIN_EMAIL?.toLowerCase();
      if (email.toLowerCase() !== superadminEmail) {
        return NextResponse.json({ error: "Access Denied: This link is reserved for the primary platform administrator." }, { status: 403 });
      }
      
      if (!user) {
        user = await User.create({ name: email.split("@")[0], email, role: "superadmin" });
      } else if (user.role !== "superadmin") {
        user.role = "superadmin";
        await user.save();
      }
    } else if (loginPanel === "admin") {
      // Strict Check: ONLY allow existing users with the 'admin' role
      if (!user || user.role !== "admin") {
        return NextResponse.json({ 
          error: "Access Denied: This account does not have cafeteria management privileges." 
        }, { status: 403 });
      }
    } else if (loginPanel === "customer") {
      // Customer Panel: Reject if they are actually an admin or superadmin
      // They MUST use their own designated management portals
      if (user && user.role !== "customer") {
        return NextResponse.json({ 
          error: `This account is registered as ${user.role}. Please use the ${user.role} dashboard to sign in.` 
        }, { status: 403 });
      }

      if (!user) {
        if (!name) {
          return NextResponse.json({ error: "Name is required for new users" }, { status: 400 });
        }
        user = await User.create({ name, email, role: "customer" });
      }
    }



    // Create session cookie
    await login(user);

    return NextResponse.json({ message: "OTP verified successfully", user: user.toObject() }, { status: 200 });
  } catch (error: any) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
