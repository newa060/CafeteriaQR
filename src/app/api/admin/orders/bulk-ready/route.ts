import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getAdminCafeteria() {
  const session = await getSession();
  if (!session || (session.user.role !== "admin" && session.user.role !== "superadmin")) {
    return null;
  }
  return session.user.cafeteriaId;
}

export async function POST(req: Request) {
  const cafeteriaId = await getAdminCafeteria();
  if (!cafeteriaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { itemName, quantity } = await req.json();

    if (!itemName || typeof quantity !== "number" || quantity <= 0) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
    }

    // Find all active orders for this cafeteria that contain the item (case-insensitive, trimmed)
    // We fetch EVERYTHING to be safe, then filter in memory to ensure we catch those that still need cooking
    const activeOrders = await Order.find({
      cafeteriaId,
      status: { $in: ["accepted", "preparing"] },
      "items.name": { $regex: new RegExp(`^${itemName.trim()}$`, 'i') }
    }).sort({ createdAt: 1 });

    let remainingToReady = quantity;
    let unitsUpdated = 0;

    for (const order of activeOrders) {
      if (remainingToReady <= 0) break;

      let orderModified = false;

      // Mutate items in-place to satisfy Mongoose's DocumentArray type
      order.items.forEach((item: any, idx: number) => {
        if (item.name.trim().toLowerCase() === itemName.trim().toLowerCase()) {
          const cooked = item.cookedQuantity || 0;
          const needed = item.quantity - cooked;

          if (needed > 0 && remainingToReady > 0) {
            const add = Math.min(needed, remainingToReady);
            order.items[idx].cookedQuantity = cooked + add;
            remainingToReady -= add;
            unitsUpdated += add;
            orderModified = true;
          }
        }
      });

      if (orderModified) {
        // Check if the entire order is now finished
        const isFinished = order.items.every((i: any) => (i.cookedQuantity || 0) >= i.quantity);
        order.status = isFinished ? "ready" : "preparing";

        // markModified ensures Mongoose detects the subdocument changes
        order.markModified('items');
        await order.save();
      }
    }

    return NextResponse.json({ 
      success: true, 
      unitsUpdated, 
      remaining: remainingToReady,
      message: unitsUpdated > 0 ? `Updated ${unitsUpdated} units.` : "No units needed updating."
    });

  } catch (error) {
    console.error("Bulk ready error:", error);
    return NextResponse.json({ error: "Server error during bulk update" }, { status: 500 });
  }
}
