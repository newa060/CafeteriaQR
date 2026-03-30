import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const session = await getSession("customer");
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { cafeteriaId, items, totalAmount, timeSlot, paymentScreenshotUrl, paymentName } = await req.json();

    if (!cafeteriaId || !items || !totalAmount || !timeSlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify cafeteria is active
    const Cafeteria = (await import("@/models/Cafeteria")).default;
    const cafeteria = await Cafeteria.findById(cafeteriaId);
    if (!cafeteria || !cafeteria.isActive) {
      return NextResponse.json({ error: "Cafeteria is currently closed and not accepting orders" }, { status: 400 });
    }

    // Basic logic to check if order time is at least 10 minutes before slot
    // For simplicity, we assume the timeSlot is in HH:mm format (e.g., "10:15")
    const now = new Date();
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const slotDate = new Date();
    slotDate.setHours(hours, minutes, 0, 0);

    const diffInMs = slotDate.getTime() - now.getTime();
    if (diffInMs < 10 * 60 * 1000) {
      return NextResponse.json({ error: "Orders must be placed at least 10 minutes before the selected slot" }, { status: 400 });
    }

    const order = await Order.create({
      cafeteriaId,
      customerId: session.user.id,
      customerName: session.user.name,
      items,
      totalAmount,
      timeSlot,
      status: "pending",
      paymentScreenshotUrl,
      paymentName,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error in customer orders API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession("customer");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const mongoose = (await import("mongoose")).default;
    // Bypassing find filter for $ne: true in case of model schema cache issues
    const allOrders = await Order.find({ 
      customerId: new mongoose.Types.ObjectId(session.user.id)
    }).sort({ createdAt: -1 });

    // Live filtering in JS to be 100% sure we catch the hiddenFromCustomer flag
    const orders = allOrders.filter((o: { toObject?: () => Record<string, unknown>; hiddenFromCustomer?: boolean }) => {
      // Handle both Mongoose document and plain object
      const doc = o.toObject ? o.toObject() : o;
      return doc.hiddenFromCustomer !== true;
    });

    return NextResponse.json(orders, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getSession("customer");
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const mongoose = (await import("mongoose")).default;
    
    // Hide all orders for this customer at once
    await mongoose.connection.collection("orders").updateMany(
      { 
        $or: [
          { customerId: new mongoose.Types.ObjectId(session.user.id) },
          { customerId: session.user.id }
        ]
      },
      { $set: { hiddenFromCustomer: true } }
    );

    return NextResponse.json({ message: "History cleared successfully" }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error("Error clearing customer history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
