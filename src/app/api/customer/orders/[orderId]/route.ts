import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { getSession } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: { orderId: string } }
) {
  const session = await getSession("customer");
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const { orderId } = params;

    const order = await Order.findOne({ 
      _id: orderId, 
      customerId: session.user.id 
    }).populate("cafeteriaId");

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error in fetch single order API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
