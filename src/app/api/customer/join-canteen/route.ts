import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cafeteria from "@/models/Cafeteria";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { canteenCode } = await req.json();

    if (!canteenCode) {
      return NextResponse.json({ error: "Canteen code is required" }, { status: 400 });
    }

    // Find the cafeteria by canteenCode
    const cafeteria = await Cafeteria.findOne({ canteenCode });
    if (!cafeteria) {
      return NextResponse.json({ error: "Invalid canteen code" }, { status: 404 });
    }

    // Update the user's cafeteriaId
    await User.findByIdAndUpdate(session.user.id, {
      cafeteriaId: cafeteria._id,
    });

    return NextResponse.json({ 
      message: "Joined canteen successfully", 
      adminId: cafeteria.adminId.toString() 
    }, { status: 200 });
  } catch (error) {
    console.error("Error in join-canteen API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
