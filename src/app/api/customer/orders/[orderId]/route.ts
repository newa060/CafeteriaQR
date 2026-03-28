import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Order from "@/models/Order";
import { getSession } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const session = await getSession("customer");
  if (!session || session.user.role !== "customer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await params;

  try {
    await dbConnect();

    // Soft delete: Mark as hidden from customer (Direct Collection Update)
    const result = await mongoose.connection.collection("orders").updateOne(
      { 
        _id: new mongoose.Types.ObjectId(orderId), 
        $or: [
          { customerId: new mongoose.Types.ObjectId(session.user.id) },
          { customerId: session.user.id }
        ]
      },
      { $set: { hiddenFromCustomer: true } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Order not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "History entry removed successfully" }, {
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error("Error hiding order history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
