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
