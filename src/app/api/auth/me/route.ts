import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import dbConnect from "@/lib/db";
import Cafeteria from "@/models/Cafeteria";

export async function GET(req: Request) {
  const panel = req.headers.get("x-panel-context") || undefined;
  const session = await getSession(panel);
  
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = session.user;
  let adminId = null;

  // If the user is a customer and has a cafeteriaId, get the associated adminId
  if (user.role === "customer" && user.cafeteriaId) {
    try {
      await dbConnect();
      const cafeteria = await Cafeteria.findById(user.cafeteriaId);
      if (cafeteria) {
        adminId = cafeteria.adminId.toString();
      }
    } catch (error) {
      console.error("Error fetching cafeteria adminId:", error);
    }
  }

  return NextResponse.json({ user: { ...user, adminId } }, { status: 200 });
}
export async function PATCH(req: Request) {
  const panel = req.headers.get("x-panel-context") || undefined;
  const session = await getSession(panel);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    const User = (await import("@/models/User")).default;

    // Whitelist editable fields
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.faculty !== undefined) updates.faculty = body.faculty;

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updates },
      { new: true }
    ).select("-password -__v");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
