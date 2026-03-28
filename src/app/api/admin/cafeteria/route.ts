import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cafeteria from "@/models/Cafeteria";
import { getSession } from "@/lib/auth";

async function getAdminCafeteria() {
  const session = await getSession();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return null;
  }
  return session.user.cafeteriaId;
}

export async function GET() {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const cafeteria = await Cafeteria.findById(cafeteriaId);
    return NextResponse.json(cafeteria);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch cafeteria" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const body = await req.json();
    
    // Whitelist updates
    const updates: any = {};
    if (body.name) updates.name = body.name;
    if (body.paymentQRUrl) updates.paymentQRUrl = body.paymentQRUrl;
    if (body.timeSlots) updates.timeSlots = body.timeSlots;
    if (body.isActive !== undefined) updates.isActive = body.isActive;

    const updatedCafeteria = await Cafeteria.findByIdAndUpdate(
      cafeteriaId,
      { $set: updates },
      { new: true }
    );

    return NextResponse.json(updatedCafeteria);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update cafeteria" }, { status: 500 });
  }
}
