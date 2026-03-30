import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Cafeteria from "@/models/Cafeteria";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
    
    const cafeteria = await Cafeteria.findById(cafeteriaId);
    if (!cafeteria) {
      return NextResponse.json({ error: "Cafeteria not found" }, { status: 404 });
    }

    // Explicitly update fields if they are provided in the request
    const updates: any = {};
    if (typeof body.name === "string") updates.name = body.name;
    if (Array.isArray(body.timeSlots)) updates.timeSlots = body.timeSlots;
    if (typeof body.isActive === "boolean") updates.isActive = body.isActive;

    // Handle paymentQRUrl with special care for deletion
    if (body.paymentQRUrl === "") {
      await Cafeteria.updateOne({ _id: cafeteriaId }, { $unset: { paymentQRUrl: "" } });
    } else if (typeof body.paymentQRUrl === "string") {
      updates.paymentQRUrl = body.paymentQRUrl;
    }

    const updatedCafeteria = await Cafeteria.findByIdAndUpdate(
      cafeteriaId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedCafeteria) {
      return NextResponse.json({ error: "Cafeteria not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCafeteria);
  } catch (error) {
    console.error(`[ADMIN-API] Update failed for cafeteria ${cafeteriaId}:`, error);
    return NextResponse.json({ error: "Failed to update cafeteria" }, { status: 500 });
  }
}
