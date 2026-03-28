import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Cafeteria from "@/models/Cafeteria";
import { getSession } from "@/lib/auth";

// Helper to check if current user is superadmin
async function isSuperadmin() {
  const session = await getSession();
  return session && session.user.role === "superadmin";
}

export async function GET() {
  if (!(await isSuperadmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const admins = await User.find({ role: "admin" }).populate("cafeteriaId");
    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isSuperadmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { name, email, canteenName, canteenCode } = await req.json();

    if (!name || !email || !canteenName || !canteenCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    // Create the Admin user first
    const admin = await User.create({
      name,
      email,
      role: "admin",
    });

    // Create the Cafeteria and link to admin
    const cafeteria = await Cafeteria.create({
      name: canteenName,
      adminId: admin._id,
      canteenCode,
    });

    // Link cafeteria back to admin
    admin.cafeteriaId = cafeteria._id;
    await admin.save();

    return NextResponse.json({ message: "Admin and Cafeteria created successfully", admin }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Canteen Code or Email already in use" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}
