import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Cafeteria from "@/models/Cafeteria";

export async function GET(
  req: Request,
  { params }: { params: { adminId: string } }
) {
  try {
    await dbConnect();
    const { adminId } = params;

    if (!adminId) {
      return NextResponse.json({ error: "Cafeteria ID is required" }, { status: 400 });
    }

    // Check if cafeteria exists and is active
    const cafeteria = await Cafeteria.findById(adminId);
    if (!cafeteria || !cafeteria.isActive) {
      return NextResponse.json({ error: "Cafeteria not found" }, { status: 404 });
    }

    // Fetch menu items for this cafeteria
    const menuItems = await MenuItem.find({ 
      cafeteriaId: adminId, 
      isAvailable: true 
    });

    return NextResponse.json({ cafeteria, menuItems });
  } catch (error) {
    console.error("Error in customer menu API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
