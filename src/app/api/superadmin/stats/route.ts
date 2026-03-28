import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Cafeteria from "@/models/Cafeteria";
import Order from "@/models/Order";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession("superadmin");
  if (!session || session.user.role !== "superadmin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await dbConnect();

    // Aggregate counts
    const totalAdmins = await User.countDocuments({ role: "admin" });
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const totalCafeterias = await Cafeteria.countDocuments();
    const totalOrders = await Order.countDocuments();

    // Total Revenue (all orders)
    const revenueAggregation = await Order.aggregate([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

    // Recent Cafeterias
    const recentCafeterias = await Cafeteria.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name canteenCode createdAt isActive");

    return NextResponse.json({
      metrics: {
        totalAdmins,
        totalCustomers,
        totalCafeterias,
        totalOrders,
        totalRevenue
      },
      recentCafeterias
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error in superadmin stats API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
