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
  X,
  Bell,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useNotification } from "@/context/NotificationContext";
import { useRef } from "react";

interface OrderItem {
  _id?: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  cookedQuantity?: number;
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
  const [bulkReadyQtys, setBulkReadyQtys] = useState<{ [key: string]: string }>({});
  const { showNotification } = useNotification();
  const notifiedOrderIds = useRef<Set<string>>(new Set());
  const isFirstLoad = useRef(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/admin/orders?t=${Date.now()}`, { cache: "no-store" });
      if (res.ok) {
        const data: Order[] = await res.json();
        
        if (isFirstLoad.current) {
          const ids = new Set(data.map(o => o._id));
          notifiedOrderIds.current = ids;
          isFirstLoad.current = false;
        } else {
          data.forEach(order => {
            if (order.status === "pending" && !notifiedOrderIds.current.has(order._id)) {
              showNotification({
                title: "New Order! 🔔",
                message: `New order from ${order.customerName}`,
                type: "info",
                role: "admin",
              });
              notifiedOrderIds.current.add(order._id);
            }
          });
        }
        
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
        fetchOrders();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to update status:", err);
      return false;
    }
  };

  const handleBulkReady = async (itemName: string, count: number) => {
    if (count <= 0) return;
    
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/orders/bulk-ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemName, quantity: count }),
      });

      if (res.ok) {
        const data = await res.json();
        setBulkReadyQtys(prev => ({ ...prev, [itemName]: "" }));
        showNotification({
          title: "Kitchen Updated 🍱",
          message: `Successfully marked ${data.unitsUpdated} units of ${itemName} as prepared.`,
          type: "success"
        });
        fetchOrders();
      } else {
        const errorData = await res.json();
        showNotification({
          title: "Update Failed",
          message: errorData.error || "Could not update kitchen quantity.",
          type: "warning"
        });
      }
    } catch (err) {
      console.error("Bulk ready error:", err);
      showNotification({
        title: "Connection Error",
        message: "Failed to connect to the server.",
        type: "warning"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    if (!confirm("Are you sure you want to delete this order from history?")) return;
    
    try {
      const res = await fetch(`/api/admin/orders?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showNotification({
          title: "Order Deleted",
          message: "The order has been removed from your history.",
          type: "success"
        });
        fetchOrders();
      }
    } catch (err) {
      console.error("Failed to delete order:", err);
    }
  };

  // Kitchen View — only accepted/preparing orders, subtracting already-cooked quantities
  const bulkBreakdown = orders
    .filter(o => o.status === "accepted" || o.status === "preparing")
    .reduce((acc: { [key: string]: { total: number; orders: any[] } }, order) => {
      order.items.forEach(item => {
        const remaining = item.quantity - (item.cookedQuantity || 0);
        if (remaining > 0) {
          if (!acc[item.name]) {
            acc[item.name] = { total: 0, orders: [] };
          }
          acc[item.name].total += remaining;
          acc[item.name].orders.push({
            orderId: order._id,
            customerName: order.customerName,
            quantity: remaining,
            timeSlot: order.timeSlot,
            status: order.status
          });
        }
      });
      return acc;
    }, {});

  const bulkTotals = orders
    .filter(o => o.status === "accepted" || o.status === "preparing")
    .reduce((acc: { [key: string]: number }, order) => {
      order.items.forEach(item => {
        const remaining = item.quantity - (item.cookedQuantity || 0);
        if (remaining > 0) {
          acc[item.name] = (acc[item.name] || 0) + remaining;
        }
      });
      return acc;
    }, {});

  const totalItemCount = (Object.values(bulkTotals) as number[]).reduce((a: number, b: number) => a + b, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 max-w-7xl lg:pt-0 px-4 sm:px-6 md:px-8">
      {/* Sticky Header Area */}
      <div className="sticky top-16 lg:top-[-32px] z-[35] bg-[#0d0d0d]/95 backdrop-blur-xl -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-1 pb-6 sm:pt-4 sm:pb-6 border-b border-white/5 shadow-2xl transition-all">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4 mb-1 sm:mb-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <h1 className="text-[20px] sm:text-3xl md:text-4xl font-black tracking-tight text-white leading-none truncate">Dashboard</h1>
                <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full animate-pulse shrink-0">
                  <div className="w-1 h-1 rounded-full bg-green-500" />
                  <span className="text-[8px] sm:text-[9px] font-bold text-green-500 uppercase tracking-widest leading-none">Live</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="md:hidden h-8 px-2.5 border-white/5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-gray-400 gap-1.5 rounded-lg shrink-0"
                onClick={() => {
                  showNotification({
                    title: "Test Notification",
                    message: "Your notifications are working!",
                    type: "info",
                    role: "admin",
                  });
                }}
              >
                <Bell className="w-3 h-3 text-primary" />
              </Button>
            </div>

            <p className="text-[10px] sm:text-sm text-gray-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Manage live orders and see what to cook.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 self-stretch md:self-auto w-full md:w-auto mt-2 md:mt-0">
            <Button 
              variant="outline" 
              className="hidden md:flex h-9 px-4 border-white/5 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400 gap-2 rounded-xl"
              onClick={() => {
                showNotification({
                  title: "Test Notification",
                  message: "Your notifications are working!",
                  type: "info",
                  role: "admin",
                });
              }}
            >
              <Bell className="w-3.5 h-3.5 text-primary" />
              <span>Test Audio</span>
            </Button>

            <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide no-scrollbar w-full md:w-auto">
              <button 
                onClick={() => setActiveTab("individual")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === "individual" ? "bg-primary text-black shadow-lg shadow-primary/20 scale-105" : "bg-white/5 text-gray-500 hover:bg-white/10"
                }`}
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Individual
              </button>
              <button 
                onClick={() => setActiveTab("bulk")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === "bulk" ? "bg-primary text-black shadow-lg shadow-primary/20 scale-105" : "bg-white/5 text-gray-500 hover:bg-white/10"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Kitchen View
              </button>
              <button 
                onClick={() => setActiveTab("history")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeTab === "history" ? "bg-primary text-black shadow-lg shadow-primary/20 scale-105" : "bg-white/5 text-gray-500 hover:bg-white/10"
                }`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                History
              </button>
            </div>
          </div>

          <div className="hidden md:flex gap-4">
            <Button 
              variant="outline"
              className="h-14 px-6 border-white/5 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 transition-all"
              onClick={fetchOrders}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              <span className="font-bold text-white uppercase tracking-widest text-sm">Force Refresh</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="h-6 sm:h-12" />

      <div className={`grid grid-cols-1 ${activeTab === 'bulk' ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-8`}>
        {/* Main Dashboard Column */}
        <div className={`${activeTab === 'bulk' ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-6`}>
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
                    activeTab === "individual" 
                      ? o.status === "pending" 
                      : (o.status === "accepted" || o.status === "preparing" || o.status === "ready" || o.status === "cancelled")
                  ).map((order) => (
                  <Card key={order._id} className="bg-[#111111] border-white/5 hover:border-primary/20 transition-all group shadow-2xl">
                    <CardContent className="p-5 sm:p-7 space-y-4 sm:space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Customer Name</p>
                          <h3 className="text-lg md:text-xl font-extrabold text-white truncate max-w-[150px]">{order.customerName}</h3>
                        </div>
                        <Badge variant={
                          order.status === "pending" ? "warning" : 
                          order.status === "cancelled" ? "destructive" : "default"
                        } className="px-2 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs">
                          {order.status === "pending" ? "Pending" : 
                           order.status === "cancelled" ? "Rejected" : "Accepted"}
                        </Badge>
                      </div>

                      <div className="space-y-1 py-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Time Slot</p>
                        <p className="text-2xl sm:text-3xl md:text-4xl font-black text-primary leading-none tracking-tight">{order.timeSlot}</p>
                      </div>

                      <div className="space-y-2 border-t border-white/5 pt-4">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-gray-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                            <span className="text-sm font-medium">
                              <span className="text-primary font-bold mr-1">{item.quantity}x</span>
                              {item.name}
                            </span>
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
                                className="w-full h-11 sm:h-14 text-base sm:text-xl font-black rounded-xl sm:rounded-2xl shadow-xl shadow-primary/30"
                                onClick={() => updateOrderStatus(order._id, "accepted")}
                              >
                                Accept Order
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="pt-4 border-t border-white/5">
                            <Button 
                              variant="outline"
                              className="w-full h-10 border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                              onClick={() => handleDeleteOrder(order._id)}
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete Record
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {orders.filter(o => 
                  activeTab === "individual" ? o.status === "pending" : (o.status !== "pending")
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
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Card className="bg-primary/10 border-primary/20 text-center py-4 sm:py-6 md:py-8">
                    <p className="text-[8px] sm:text-[10px] md:text-xs font-bold text-primary uppercase tracking-widest mb-1">Items to Cook</p>
                    <p className="text-2xl sm:text-4xl md:text-5xl font-black text-primary">{totalItemCount}</p>
                  </Card>
                  <Card className="bg-white/5 border-white/5 text-center py-4 sm:py-6 md:py-8">
                    <p className="text-[8px] sm:text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Live Orders</p>
                    <p className="text-2xl sm:text-4xl md:text-5xl font-black text-white">{orders.filter(o => o.status === "accepted" || o.status === "preparing").length}</p>
                  </Card>
                </div>

                <Card className="bg-[#111111] border-white/5 shadow-2xl">
                  <div className="p-5 md:p-8 border-b border-white/5">
                    <h3 className="text-xl md:text-2xl font-black text-white">What to Cook Now</h3>
                    <p className="text-sm text-gray-500 mt-1">Tap + or − to set how many you've cooked, then press Done.</p>
                  </div>
                  <CardContent className="p-3 md:p-6 space-y-4">
                    {Object.entries(bulkBreakdown).map(([name, data]) => {
                      const currentQty = parseInt(bulkReadyQtys[name] || "0");
                      return (
                        <div key={name} className="bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden">
                          {/* Item Header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-white/5">
                            <div>
                              <p className="text-[9px] font-black text-primary uppercase tracking-widest">To Cook</p>
                              <h3 className="text-lg font-black text-white leading-tight">{name}</h3>
                            </div>
                            <div className="bg-primary/20 border border-primary/30 px-3 py-1 rounded-xl">
                              <span className="text-3xl font-black text-primary italic">{data.total}x</span>
                            </div>
                          </div>

                          {/* Stepper + Action */}
                          <div className="p-4 space-y-3">
                            {/* Label */}
                            <p className="text-xs text-gray-400 font-bold text-center uppercase tracking-wider">How many did you cook?</p>

                            {/* Stepper Controls */}
                            <div className="flex items-center justify-center gap-4">
                              <button
                                className="w-14 h-14 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white text-3xl font-black border border-white/10"
                                onClick={() => setBulkReadyQtys(prev => ({
                                  ...prev,
                                  [name]: String(Math.max(0, (parseInt(prev[name] || "0") - 1)))
                                }))}
                              >
                                −
                              </button>
                              <div className="flex flex-col items-center">
                                <span className="text-5xl font-black text-white w-20 text-center tabular-nums">
                                  {currentQty}
                                </span>
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                  of {data.total} total
                                </span>
                              </div>
                              <button
                                className="w-14 h-14 rounded-2xl bg-primary/20 hover:bg-primary/30 active:scale-95 transition-all flex items-center justify-center text-primary text-3xl font-black border border-primary/30"
                                onClick={() => setBulkReadyQtys(prev => ({
                                  ...prev,
                                  [name]: String(Math.min(data.total, (parseInt(prev[name] || "0") + 1)))
                                }))}
                              >
                                +
                              </button>
                            </div>

                            {/* Done Button */}
                            <Button 
                              className="w-full h-14 bg-green-600 hover:bg-green-500 active:scale-[0.98] text-white text-base font-black rounded-xl shadow-lg shadow-green-900/40 gap-2 transition-all"
                              onClick={() => handleBulkReady(name, currentQty)}
                              disabled={currentQty <= 0 || isRefreshing}
                            >
                              {isRefreshing 
                                ? <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                                : <><CheckCircle2 className="w-5 h-5" /> Done Cooking {currentQty > 0 ? `(${currentQty})` : ""}</>
                              }
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                    {Object.keys(bulkBreakdown).length === 0 && (
                      <div className="py-10 text-center text-gray-500 font-bold italic opacity-50">
                        No items to cook right now. 🎉
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar — hide on Kitchen View */}
        {activeTab !== 'bulk' && (
          <div className="space-y-8">
            <Card className="bg-[#111111] border-white/5 shadow-2xl overflow-hidden rounded-2xl sm:rounded-3xl">
              <div className="bg-[#222222] p-4 sm:p-6 border-b border-white/5">
                <h3 className="text-lg sm:text-xl font-black text-white">Today's Summary</h3>
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
              className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white group border border-dashed border-white/10 h-12 sm:h-14 rounded-xl sm:rounded-2xl"
              onClick={fetchOrders}
              disabled={isRefreshing}
            >
              {isRefreshing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 group-active:rotate-180 transition-transform" /> }
              <span className="text-xs sm:text-base">{isRefreshing ? "Refreshing..." : "Force Refresh"}</span>
            </Button>
          </div>
        )}
      </div>

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
              className="relative max-w-2xl w-full h-[85vh] bg-[#0a0a0a] rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-white/10 flex flex-col pt-2 shadow-2xl"
            >
              <div className="p-4 sm:p-6 flex items-center justify-between border-b border-white/5">
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

              <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-black/40">
                <img 
                  src={selectedScreenshot || ""} 
                  alt="Payment Receipt" 
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl shadow-black ring-1 ring-white/10"
                />
              </div>

              <div className="p-6 bg-white/5 flex flex-col items-center gap-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] italic">
                  Powered by MenuQR Verification
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
