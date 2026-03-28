import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cafeteria from "@/models/Cafeteria";
import { getSession } from "@/lib/auth";

async function getAdminCafeteria() {
  // Strictly look for the admin session first to ensure we get the cafeteria context
  const session = await getSession("admin");
  
  // If no admin session, fallback to checking if it's a superadmin visiting
  if (!session) {
    const fallbackSession = await getSession("superadmin");
    if (!fallbackSession) return null;
    return fallbackSession.user.cafeteriaId;
  }

  console.log(`[ADMIN-API] Fetching cafeteria for user: ${session.user.email}, ID: ${session.user.cafeteriaId}`);
  return session.user.cafeteriaId;
}

export async function GET() {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "No cafeteria associated with this account" }, { status: 401 });
  }

  try {
    await dbConnect();
    const cafeteria = await Cafeteria.findById(cafeteriaId);
    
    if (!cafeteria) {
      console.warn(`[ADMIN-API] Cafeteria ${cafeteriaId} not found in database.`);
      return NextResponse.json({ error: "Cafeteria not found" }, { status: 404 });
    }

    return NextResponse.json(cafeteria);
  } catch (error) {
    console.error(`[ADMIN-API] Error fetching cafeteria ${cafeteriaId}:`, error);
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
