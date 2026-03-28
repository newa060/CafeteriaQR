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

    // Create the Cafeteria first (so we have its _id for the admin user)
    const cafeteria = await Cafeteria.create({
      name: canteenName,
      adminId: new (require("mongoose").Types.ObjectId)(), // temporary placeholder
      canteenCode,
    });

    // Create the Admin user with cafeteriaId already set (required by schema)
    const admin = await User.create({
      name,
      email,
      role: "admin",
      cafeteriaId: cafeteria._id,
    });

    // Update the cafeteria with the real adminId
    cafeteria.adminId = admin._id;
    await cafeteria.save();

    return NextResponse.json({ message: "Admin and Cafeteria created successfully", admin }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Canteen Code or Email already in use" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!(await isSuperadmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id, name, email, canteenName, canteenCode } = await req.json();

    if (!id || !name || !email || !canteenName || !canteenCode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Find the admin user first
    const admin = await User.findById(id);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Update the Admin User
    admin.name = name;
    admin.email = email;
    await admin.save();

    // Update the associated Cafeteria
    if (admin.cafeteriaId) {
      await Cafeteria.findByIdAndUpdate(admin.cafeteriaId, {
        name: canteenName,
        canteenCode: canteenCode
      });
    }

    return NextResponse.json({ message: "Admin and Cafeteria updated successfully" });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json({ error: "Canteen Code or Email already in use" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!(await isSuperadmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 });
    }

    await dbConnect();
    
    // Find the admin to get their cafeteriaId
    const admin = await User.findById(id);
    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Delete the Cafeteria record
    if (admin.cafeteriaId) {
      await Cafeteria.findByIdAndDelete(admin.cafeteriaId);
    }

    // Delete the Admin User
    await User.findByIdAndDelete(id);

    return NextResponse.json({ message: "Admin and Cafeteria deleted successfully" });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}

