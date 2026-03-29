import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Cafeteria from "@/models/Cafeteria";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, faculty, canteenCode, adminId } = await req.json();
    console.log("Registering customer:", { name, email, faculty, canteenCode, adminId });

    if (!name || !email || !faculty || (!canteenCode && !adminId)) {
      return NextResponse.json({ error: "All profile fields are required" }, { status: 400 });
    }

    // Check if user already exists (safety check)
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return NextResponse.json({ error: "User already exists. Please log in." }, { status: 400 });
    }

    // Validate Canteen Code or Admin ID
    let cafeteria = null;
    if (canteenCode) {
      cafeteria = await Cafeteria.findOne({ canteenCode: canteenCode.toUpperCase() });
    } else if (adminId) {
      // Same lookup logic as the menu API
      cafeteria = await Cafeteria.findOne({ adminId: adminId });
      if (!cafeteria) {
        cafeteria = await Cafeteria.findById(adminId).catch(() => null);
      }
    }

    if (!cafeteria) {
      const errorMsg = canteenCode 
        ? "Invalid Canteen Code. Please check with your cafeteria." 
        : "Could not identify cafeteria. Please enter the canteen code manually.";
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Create the new customer
    user = await User.create({
      name,
      email: email.toLowerCase(),
      faculty,
      cafeteriaId: cafeteria._id,
      role: "customer"
    });

    // Create session cookie
    await login(user);

    return NextResponse.json({ 
      message: "Registration successful", 
      user: user.toObject() 
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error in customer registration API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
