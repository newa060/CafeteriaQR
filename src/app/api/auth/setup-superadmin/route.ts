import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// One-time setup endpoint to promote the SUPERADMIN_EMAIL to superadmin role.
// Also clears the session cookie so the user gets a fresh login with the correct role.
export async function GET() {
  try {
    const superadminEmail = process.env.SUPERADMIN_EMAIL;

    if (!superadminEmail) {
      return NextResponse.json(
        { error: "SUPERADMIN_EMAIL is not set in .env.local" },
        { status: 500 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: superadminEmail.toLowerCase() });

    if (!user) {
      // Clear session and redirect to login so they can register first
      const response = NextResponse.redirect(
        new URL(
          "/login",
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
        )
      );
      response.cookies.delete("session");
      return response;
    }

    user.role = "superadmin";
    user.cafeteriaId = undefined;
    await user.save();

    // Clear the old session cookie so they must log in fresh with the new role
    const response = NextResponse.redirect(
      new URL(
        "/login",
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      )
    );
    response.cookies.set("session", "", {
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Error in setup-superadmin:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
