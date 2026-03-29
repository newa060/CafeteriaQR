"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Clock, 
  Loader2, 
  Package, 
  LayoutGrid, 
  ListTodo, 
  RefreshCw,
  Search,
  CheckCircle,
  Pizza,
  ArrowRight,
  Eye,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

interface OrderItem {
  name: string;
  quantity: number;
}

interface Order {
  _id: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  timeSlot: string;
  status: "pending" | "accepted" | "preparing" | "ready" | "cancelled";
  paymentScreenshotUrl?: string;
  paymentName?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"individual" | "bulk" | "history">("individual");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [rejectConfirmId, setRejectConfirmId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    // Refresh for "Real-time" updates every 8 seconds
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        fetchOrders(); // Refresh after update
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // 1. Kitchen View (Bulk Breakdown) - Now shows 'pending' orders so the chef knows what to cook
  const bulkBreakdown = orders
    .filter(o => o.status === "pending" || o.status === "preparing")
    .reduce((acc: { [key: string]: { total: number; orders: any[] } }, order) => {
      order.items.forEach(item => {
        if (!acc[item.name]) {
          acc[item.name] = { total: 0, orders: [] };
        }
        acc[item.name].total += item.quantity;
        acc[item.name].orders.push({
          orderId: order._id,
          customerName: order.customerName,
          quantity: item.quantity,
          timeSlot: order.timeSlot,
          status: order.status
        });
      });
      return acc;
    }, {});

  const bulkTotals = orders
    .filter(o => o.status === "pending" || o.status === "preparing")
    .reduce((acc: { [key: string]: number }, order) => {
      order.items.forEach(item => {
        acc[item.name] = (acc[item.name] || 0) + item.quantity;
      });
      return acc;
    }, {});

  const totalItemCount = Object.values(bulkTotals).reduce((a: number, b: number) => a + b, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-7xl">
      {/* Sticky Header Area */}
      <div className="sticky top-[72px] lg:top-[-32px] z-30 bg-[#0d0d0d]/95 backdrop-blur-xl -mx-6 lg:-mx-8 px-6 lg:px-8 py-6 mb-10 border-b border-white/5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold tracking-tight text-white leading-none">Canteen Dashboard</h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium whitespace-nowrap">Manage live orders and see what to cook.</p>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 bg-[#1a1a1a] p-1 rounded-2xl border border-white/5 shadow-2xl self-start md:self-auto max-w-full overflow-x-auto scrollbar-hide no-scrollbar">
            <button 
              onClick={() => setActiveTab("individual")}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "individual" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Individual
            </button>
            <button 
              onClick={() => setActiveTab("bulk")}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "bulk" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              Kitchen
            </button>
            <button 
              onClick={() => setActiveTab("history")}
              className={`px-4 sm:px-5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeTab === "history" 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Dashboard Grid */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "individual" || activeTab === "history" ? (
              <motion.div 
                key={activeTab}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6"
              >
                {orders
                  .filter(o => 
                    activeTab === "individual" ? o.status === "pending" : o.status !== "pending"
                  ).map((order) => (
                  <Card key={order._id} className="bg-[#111111] border-white/5 hover:border-primary/20 transition-all group shadow-2xl">
                    <CardContent className="p-7 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Customer Name</p>
                          <h3 className="text-xl font-extrabold text-white truncate max-w-[150px]">{order.customerName}</h3>
                        </div>
                        <Badge variant={
                          order.status === "pending" ? "warning" : 
                          order.status === "ready" ? "default" : "destructive"
                        } className="px-3 py-1 rounded-lg">
                          {order.status === "ready" ? "accepted" : order.status === "pending" ? "pending" : "rejected"}
                        </Badge>
                      </div>

                      <div className="space-y-1 py-1">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Time Slot</p>
                        <p className="text-3xl md:text-4xl font-black text-primary leading-none tracking-tight">{order.timeSlot}</p>
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        {order.status === "pending" ? (
                          <div className="flex flex-col gap-3 pt-2">
                            {order.paymentScreenshotUrl ? (
                              <Button 
                                variant="outline"
                                className="h-12 w-full rounded-xl border-white/10 hover:border-primary/50 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                onClick={() => setSelectedScreenshot(order.paymentScreenshotUrl!)}
                              >
                                <Eye className="w-4 h-4 text-primary" />
                                Verify Receipt
                              </Button>
                            ) : (
                              <div className="h-12 w-full rounded-xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center opacity-30 text-[10px] font-bold uppercase tracking-widest gap-2">
                                <Eye className="w-4 h-4" />
                                No Receipt
                              </div>
                            )}
                            <div className="flex gap-2 w-full">
                              <Button 
                                variant="outline"
                                className="w-1/3 h-12 sm:h-14 text-xs sm:text-sm font-black border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-2xl transition-all"
                                onClick={() => setRejectConfirmId(order._id)}
                              >
                                Reject
                              </Button>
                              <Button 
                                className="w-2/3 h-12 sm:h-14 text-lg sm:text-xl font-black rounded-2xl shadow-xl shadow-primary/30"
                                onClick={() => updateOrderStatus(order._id, "ready")}
                              >
                                Accept
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="py-2 text-center">
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Final Status</p>
                            <p className={`text-xl font-black mt-1 ${
                              order.status === 'ready' ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {order.status === 'ready' ? 'ORDER READY' : 'ORDER REJECTED'}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {orders.filter(o => 
                  activeTab === "individual" ? o.status === "pending" : o.status !== "pending"
                ).length === 0 && (
                  <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-700">
                    <Pizza className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-xl font-bold italic opacity-30">
                      {activeTab === "individual" ? "No pending orders." : "No history found."}
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="bulk"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                {/* Top Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-primary/10 border-primary/20 text-center py-5 md:py-8">
                    <p className="text-[9px] md:text-xs font-bold text-primary uppercase tracking-widest mb-1">Items to Cook</p>
                    <p className="text-3xl md:text-5xl font-black text-primary">{totalItemCount}</p>
                  </Card>
                  <Card className="bg-white/5 border-white/5 text-center py-5 md:py-8">
                    <p className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Live Orders</p>
                    <p className="text-3xl md:text-5xl font-black text-white">{orders.filter(o => o.status === "pending" || o.status === "preparing").length}</p>
                  </Card>
                </div>

                {/* Detailed Bulk List */}
                <Card className="bg-[#111111] border-white/5 shadow-2xl">
                  <div className="p-6 md:p-8 border-b border-white/5">
                    <h3 className="text-xl md:text-2xl font-black text-white">What to Cook Now</h3>
                    <p className="text-sm md:text-base text-gray-500 mt-1">Combined totals of all items currently ordered by students.</p>
                  </div>
                  <CardContent className="p-4 md:p-8 space-y-3 md:space-y-4">
                    {Object.entries(bulkBreakdown).map(([name, data]) => (
                      <div key={name} className="flex flex-col bg-white/5 rounded-2xl border border-white/5 shadow-inner overflow-hidden">
                        <div className="flex justify-between items-center p-4 md:p-5">
                          <span className="text-base md:text-lg font-bold text-white tracking-tight">{name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-2xl md:text-3xl font-black text-primary">{String(data.total)}x</span>
                          </div>
                        </div>
                        
                        <div className="bg-black/20 border-t border-white/5 p-4 space-y-3">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Individual Orders</p>
                          {data.orders.map((subOrder: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between bg-white/5 rounded-xl p-3 border border-white/5">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-white">{subOrder.customerName}</span>
                                <span className="text-[10px] font-medium text-gray-500">Qty: {subOrder.quantity} • {subOrder.timeSlot}</span>
                              </div>
                              <Button 
                                variant="outline"
                                className="h-9 px-4 text-[10px] font-black uppercase text-green-500 border-green-500/20 hover:bg-green-500/10 rounded-lg"
                                onClick={() => updateOrderStatus(subOrder.orderId, "ready")}
                              >
                                Accept
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(bulkBreakdown).length === 0 && (
                      <div className="py-10 text-center text-gray-500 font-bold italic opacity-50">
                        No items to cook right now.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar / Statistics Panel */}
        <div className="space-y-8">
          <Card className="bg-[#111111] border-white/5 shadow-2xl overflow-hidden rounded-3xl">
            <div className="bg-[#222222] p-6 border-b border-white/5">
              <h3 className="text-xl font-black text-white">Today's Summary</h3>
            </div>
            <CardContent className="p-6 space-y-4 divide-y divide-white/5">
              {Object.entries(bulkTotals).map(([name, count]) => (
                <div key={name} className="flex justify-between items-center py-4 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-primary">{count}x</span>
                    <span className="font-bold text-white text-md truncate max-w-[120px]">{name}</span>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 text-xs font-bold">
                    {Math.ceil(count / 10)}x
                  </div>
                </div>
              ))}
              <div className="pt-6 flex justify-between items-center">
                <span className="text-lg font-black text-white">Total Items</span>
                <span className="text-3xl font-black text-primary border-b-4 border-primary/20">{totalItemCount}</span>
              </div>
            </CardContent>
          </Card>

          <Button 
            variant="ghost" 
            className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white group border border-dashed border-white/10 h-14 rounded-2xl"
            onClick={fetchOrders}
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform" /> }
            <span>{isRefreshing ? "Refreshing..." : "Force Refresh"}</span>
          </Button>
        </div>
      </div>

      {/* Screenshot Modal */}
      <AnimatePresence>
        {selectedScreenshot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-2xl w-full h-[85vh] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col pt-2 shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-black text-white leading-none">Verify Payment</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Receipt Preview</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedScreenshot(null)}
                  className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-all shadow-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Image Container */}
              <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-black/40">
                <img 
                  src={selectedScreenshot || ""} 
                  alt="Payment Receipt" 
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black ring-1 ring-white/10"
                />
              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-white/5 flex flex-col items-center gap-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] italic">
                  Powered by MenuQR Verification
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Confirmation Modal */}
      <AnimatePresence>
        {rejectConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="max-w-md w-full bg-[#111111] rounded-[2rem] overflow-hidden border border-red-500/20 shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">Reject Order?</h3>
              <p className="text-gray-400 mb-8">
                Are you sure you want to reject this order? The student will be notified and this action cannot be undone.
              </p>
              
              <div className="flex gap-4">
                <Button 
                  variant="outline"
                  className="flex-1 h-14 rounded-2xl border-white/10 hover:bg-white/5"
                  onClick={() => setRejectConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold tracking-wide"
                  onClick={() => {
                    updateOrderStatus(rejectConfirmId, "cancelled");
                    setRejectConfirmId(null);
                  }}
                >
                  Confirm Reject
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
