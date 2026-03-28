import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Cafeteria from "@/models/Cafeteria";
import { login } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { name, email, faculty, canteenCode } = await req.json();

    if (!name || !email || !faculty || !canteenCode) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Check if user already exists (safety check)
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      return NextResponse.json({ error: "User already exists. Please log in." }, { status: 400 });
    }

    // Validate Canteen Code
    const cafeteria = await Cafeteria.findOne({ canteenCode: canteenCode.toUpperCase() });
    if (!cafeteria) {
      return NextResponse.json({ error: "Invalid Canteen Code. Please check with your cafeteria." }, { status: 400 });
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
