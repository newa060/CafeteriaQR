"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  Package, 
  Timer, 
  UtensilsCrossed, 
  CheckCheck,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useNotification } from "@/context/NotificationContext";
import { NotificationSheet } from "@/components/NotificationSheet";

interface Order {
  _id: string;
  status: "pending" | "accepted" | "cancelled";
  totalAmount: number;
  timeSlot: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  cafeteriaId: { name: string };
  createdAt: string;
}

const statusMap = {
  pending: { label: "Order Pending", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
  accepted: { label: "Order Accepted", icon: CheckCircle2, color: "text-blue-500", bg: "bg-blue-500/10" },
  cancelled: { label: "Order Cancelled", icon: Package, color: "text-red-500", bg: "bg-red-500/10" },
};

export default function OrderTrackPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const adminId = params.adminId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const previousStatus = useRef<string | null>(null);
  const { unreadCount, markAllAsRead } = useNotification();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Synthesized notification sound (avoids external asset blocking)
  const playNotificationSound = (type: "success" | "error") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioContext();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      }

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio Context failed", e);
    }
  };

  useEffect(() => {
    if (order && previousStatus.current && previousStatus.current !== order.status) {
      if (order.status === "accepted") {
        if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
        playNotificationSound("success");
      } else if (order.status === "cancelled") {
        if ("vibrate" in navigator) navigator.vibrate([300, 100, 300, 100, 300]);
        playNotificationSound("error");
      }
    }
    if (order) {
      previousStatus.current = order.status;
    }
  }, [order?.status]);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const res = await fetch(`/api/customer/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        }
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    
    // Poll for status updates every 10 seconds
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <Package className="w-16 h-16 text-gray-700 mb-4" />
        <h2 className="text-xl font-bold mb-2">Order Not Found</h2>
        <p className="text-gray-500 mb-6">We couldn't find the order you're looking for.</p>
        <Button onClick={() => router.push(`/customer/${adminId}/menu`)}>Back to Menu</Button>
      </div>
    );
  }

  const status = statusMap[order.status];

  return (
    <div className="pb-10 max-w-lg mx-auto bg-background text-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/customer/${adminId}/menu`)}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Track Order</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(true)} 
              className="text-primary hover:bg-primary/10 p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      <NotificationSheet 
        isOpen={isNotificationsOpen} 
        onClose={() => {
          setIsNotificationsOpen(false);
          markAllAsRead();
        }} 
      />

      <div className="p-4 space-y-6">
        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="bg-black/40 border-white/5 overflow-hidden">
            <CardContent className="p-8 flex flex-col items-center text-center gap-4">
              <div className={`${status.bg} p-6 rounded-full inline-flex`}>
                <status.icon className={`w-12 h-12 ${status.color}`} />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-white">{status.label}</h2>
                <p className="text-gray-400">Order ID: #{order._id.slice(-6).toUpperCase()}</p>
              </div>
              
              
              {order.status !== "cancelled" ? (
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-4">
                  <motion.div 
                    className="h-full bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ 
                      width: order.status === "pending" ? "50%" : "100%" 
                    }}
                  />
                </div>
              ) : (
                <div className="w-full mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold">
                  Your order receipt could not be verified. Please contact the canteen.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Order Info */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Pickup Info</h2>
          </div>
          <Card className="bg-black/40 border-white/5">
            <CardContent className="p-5 flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Time Slot</p>
                <p className="text-xl font-bold text-white">{order.timeSlot}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-sm text-gray-500 uppercase tracking-wider">Canteen</p>
                <p className="font-bold text-white">{order.cafeteriaId.name}</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Order Items */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white">Your Order</h2>
          <Card className="bg-black/40 border-white/5">
            <CardContent className="p-5 space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-white/5 border-white/10">{item.quantity}x</Badge>
                    <span className="font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm text-gray-400">RS {item.price * item.quantity}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-white/5 flex justify-between items-center text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">RS {order.totalAmount}</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <Button 
          variant="outline" 
          className="w-full h-14 border-white/5 text-gray-400"
          onClick={() => router.push(`/customer/${adminId}/menu`)}
        >
          Back to Menu
        </Button>
      </div>
      <div className="py-12 flex flex-col items-center justify-center opacity-30">
        <div className="h-px w-24 bg-white/10 mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Powered by MenuQR</p>
      </div>
    </div>
  );
}
