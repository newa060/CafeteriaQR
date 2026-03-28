import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import MenuItem from "@/models/MenuItem";
import User from "@/models/User";
import { getSession } from "@/lib/auth";

// Helper to check if current user is admin/superadmin and return their cafeteriaId
async function getAdminCafeteria() {
  const session = await getSession();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return null;
  }
  // If cafeteriaId is in the session (JWT), use it directly
  if (session.user.cafeteriaId) {
    return session.user.cafeteriaId;
  }
  // Fallback: look it up from DB (handles sessions created before cafeteria was linked)
  await dbConnect();
  const user = await User.findById(session.user.id).select("cafeteriaId");
  return user?.cafeteriaId?.toString() || null;
}

export async function GET() {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const menuItems = await MenuItem.find({ cafeteriaId });
    return NextResponse.json(menuItems);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { name, description, price, category, imageUrl, isAvailable } = await req.json();

    if (!name || !price || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const menuItem = await MenuItem.create({
      cafeteriaId,
      name,
      description,
      price,
      category,
      imageUrl,
      isAvailable,
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create menu item" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { id, ...updateData } = await req.json();

    const updatedItem = await MenuItem.findOneAndUpdate(
      { _id: id, cafeteriaId },
      updateData,
      { new: true }
    );

    if (!updatedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updatedItem);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update menu item" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const deletedItem = await MenuItem.findOneAndDelete({ _id: id, cafeteriaId });

    if (!deletedItem) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete menu item" }, { status: 500 });
  }
}
