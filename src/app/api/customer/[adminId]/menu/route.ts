import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import Cafeteria from "@/models/Cafeteria";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    await dbConnect();
    const { adminId } = await params;

    // The 'adminId' from the URL refers to the User ID of the cafeteria manager
    // We must find the cafeteria whose adminId field matches this ID
    let cafeteria = await Cafeteria.findOne({ adminId: adminId });
    
    // Fallback: Check if the ID provided is actually the Cafeteria's own _id
    if (!cafeteria) {
      cafeteria = await Cafeteria.findById(adminId);
    }
    
    if (!cafeteria || !cafeteria.isActive) {
      console.warn(`[CUSTOMER-API] Cafeteria lookup failed for ID/AdminID: ${adminId}`);
      return NextResponse.json({ error: "Cafeteria not found or inactive" }, { status: 404 });
    }


    // Fetch menu items for this cafeteria
    const menuItems = await MenuItem.find({ 
      cafeteriaId: cafeteria._id, 
      isAvailable: true 
    });

    return NextResponse.json({ cafeteria, menuItems });
  } catch (error) {
    console.error("Error in customer menu API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
