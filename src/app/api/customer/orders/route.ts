import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { cafeteriaId, items, totalAmount, timeSlot, paymentScreenshotUrl, paymentName } = await req.json();

    if (!cafeteriaId || !items || !totalAmount || !timeSlot) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      customerId: session.user._id,
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const orders = await Order.find({ customerId: session.user._id }).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
