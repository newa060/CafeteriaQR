"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Clock, 
  CreditCard, 
  QrCode, 
  CheckCircle2, 
  Loader2,
  Image as ImageIcon,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { CldUploadWidget } from "next-cloudinary";

interface MenuItem {
  _id: string;
  name: string;
  price: number;
}

interface Cafeteria {
  _id: string;
  name: string;
  paymentQRUrl?: string;
  timeSlots: string[];
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;
  const { user } = useAuth();

  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [paymentName, setPaymentName] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load cart from local storage
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      router.push(`/customer/${adminId}/menu`);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/customer/${adminId}/menu`);
        if (res.ok) {
          const data = await res.json();
          setCafeteria(data.cafeteria);
          setMenuItems(data.menuItems);
          
          // Set default time slot if available
          if (data.cafeteria.timeSlots?.length > 0) {
            setSelectedTimeSlot(data.cafeteria.timeSlots[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [adminId, router]);

  const cartItems = menuItems.filter(item => cart[item._id] > 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * cart[item._id]), 0);

  const handleSubmit = async () => {
    if (!selectedTimeSlot) {
      setError("Please select a time slot");
      return;
    }
    // Logic for 10-minute constraint is handled in the API, but let's check it briefly here too
    
    setSubmitting(true);
    setError("");

    try {
      const orderData = {
        cafeteriaId: adminId,
        items: cartItems.map(item => ({
          menuItemId: item._id,
          name: item.name,
          quantity: cart[item._id],
          price: item.price
        })),
        totalAmount,
        timeSlot: selectedTimeSlot,
        paymentScreenshotUrl: screenshotUrl,
        paymentName: paymentName || user?.name
      };

      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      if (res.ok) {
        const order = await res.json();
        localStorage.removeItem("cart");
        router.push(`/customer/${adminId}/track?orderId=${order._id}`);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to place order");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-lg mx-auto bg-background text-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Checkout</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="p-4 space-y-6">
        {/* Time-slot Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Time-slot</h2>
          </div>
          <p className="text-xs text-gray-500">Choose a time-slot 15 minute</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cafeteria?.timeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => setSelectedTimeSlot(slot)}
                className={`flex items-center justify-center h-12 rounded-xl border text-sm font-medium transition-all ${
                  selectedTimeSlot === slot 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </section>

        {/* Payment Section */}
        <section className="space-y-4 pt-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Payment</h2>
          </div>
          
          <Card className="bg-black/40 border-white/5 overflow-hidden">
            <CardContent className="p-6 flex flex-col items-center gap-6">
              {cafeteria?.paymentQRUrl ? (
                <div className="bg-white p-4 rounded-3xl">
                  <img src={cafeteria.paymentQRUrl} alt="Payment QR" className="w-48 h-48 sm:w-56 sm:h-56 object-contain" />
                </div>
              ) : (
                <div className="bg-white/5 p-12 rounded-3xl border border-dashed border-white/10 flex flex-col items-center gap-2">
                  <QrCode className="w-16 h-16 text-gray-700" />
                  <span className="text-gray-500 text-sm">No payment QR set</span>
                </div>
              )}
              
              <div className="w-full space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">Payment Name/Remarks</label>
                  <Input 
                    placeholder="e.g. John Doe / Burger" 
                    value={paymentName}
                    onChange={(e) => setPaymentName(e.target.value)}
                  />
                </div>

                {/* Screenshot Upload */}
                <CldUploadWidget 
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={(result: any) => setScreenshotUrl(result.info.secure_url)}
                >
                  {({ open }) => (
                    <button
                      type="button"
                      onClick={() => open()}
                      className={`w-full h-14 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
                        screenshotUrl 
                          ? "bg-green-500/10 border-green-500/50 text-green-500" 
                          : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
                      }`}
                    >
                      {screenshotUrl ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Screenshot Uploaded</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="w-5 h-5" />
                          <span>Upload Payment Screenshot</span>
                        </>
                      )}
                    </button>
                  )}
                </CldUploadWidget>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Order Summary */}
        <section className="bg-white/5 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>Subtotal</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-primary">${totalAmount.toFixed(2)}</span>
          </div>
        </section>

        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Submit */}
        <Button 
          className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20" 
          disabled={submitting || !selectedTimeSlot}
          onClick={handleSubmit}
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Order"}
        </Button>
      </div>
    </div>
  );
}
