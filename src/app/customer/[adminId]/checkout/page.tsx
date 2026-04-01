"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { ConfirmationModal } from "@/components/ConfirmationModal";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
}

interface Cafeteria {
  _id: string;
  name: string;
  paymentQRUrl?: string;
  timeSlots: string[];
  isActive: boolean;
}

const formatTime12h = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  if (!h || !m) return time24;
  let hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${m} ${period}`;
};

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;
  const { user } = useAuth();

  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [isCustomTime, setIsCustomTime] = useState(false);
  const [customHour, setCustomHour] = useState("09");
  const [customMinute, setCustomMinute] = useState("00");
  const [customPeriod, setCustomPeriod] = useState("AM");
  const [customTimeValue, setCustomTimeValue] = useState("09:00");
  const [paymentName, setPaymentName] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  // Custom uploader states
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "CafeteriaQR");

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "da5jaib7d"}/image/upload`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (data.secure_url) {
        setScreenshotUrl(data.secure_url);
      } else {
        console.error("Failed to upload screenshot");
      }
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploadingReceipt(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

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

  useEffect(() => {
    if (isCustomTime) {
      let h = parseInt(customHour);
      if (customPeriod === "PM" && h !== 12) h += 12;
      if (customPeriod === "AM" && h === 12) h = 0;
      setCustomTimeValue(`${h.toString().padStart(2, '0')}:${customMinute}`);
    }
  }, [customHour, customMinute, customPeriod, isCustomTime]);

  // Intercept Browser Back Button
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.pushState({ noBack: true }, "");

      const handlePopState = (event: PopStateEvent) => {
        // Any back action from checkout should show the prompt
        // as requested by the user.
        window.history.pushState({ noBack: true }, "");
        setPendingUrl(`/customer/${adminId}/menu`);
        setShowExitConfirm(true);
      };

      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [router]);

  const confirmExit = (url: string) => {
    setPendingUrl(url);
    setShowExitConfirm(true);
  };

  const cartItems = menuItems.filter(item => cart[item._id] > 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + (item.price * cart[item._id]), 0);

  const handleSubmit = async () => {
    if (cafeteria && !cafeteria.isActive) {
      setError("Cafeteria is currently closed and not accepting orders.");
      return;
    }

    const finalTimeSlot = isCustomTime ? customTimeValue : selectedTimeSlot;
    
    if (!finalTimeSlot) {
      setError("Please select or specify a time slot");
      return;
    }

    if (isCustomTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(customTimeValue)) {
      setError("Please enter a valid time (HH:MM)");
      return;
    }

    // Safely calculate the slot time in the client's local timezone
    const [h, m] = finalTimeSlot.split(":").map(Number);
    const slotDate = new Date();
    slotDate.setHours(h, m, 0, 0);

    // If the selected slot hour is earlier than the current hour, 
    // it implies an order for the next day.
    if (slotDate.getTime() < Date.now()) {
      slotDate.setDate(slotDate.getDate() + 1);
    }

    const diffInMs = slotDate.getTime() - Date.now();
    if (diffInMs < 10 * 60 * 1000) {
      setError("Orders must be placed at least 10 minutes before the selected slot");
      return;
    }
    
    // Validate mandatory payment details
    // Validate mandatory payment details
    if (!paymentName.trim()) {
      setError("Please enter your name or payment remarks");
      const el = document.getElementById("payment-name-input");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!screenshotUrl) {
      setError("Please upload your payment screenshot");
      const el = document.getElementById("screenshot-upload-btn");
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

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
        timeSlot: finalTimeSlot,
        slotTimestamp: slotDate.getTime(),
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
        router.push(`/customer/${adminId}/order-success`);
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
        <Button variant="ghost" size="icon" onClick={() => confirmExit(`/customer/${adminId}/menu`)}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-black uppercase tracking-widest text-primary">Checkout</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="p-4 space-y-6">
        {cafeteria && !cafeteria.isActive && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-red-500">Cafeteria is Closed</p>
              <p className="text-xs text-red-500/70">The cafeteria has stopped accepting orders. You cannot complete this checkout at this time.</p>
            </div>
          </div>
        )}

        {/* Time-slot Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Time-slot</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cafeteria?.timeSlots.map(slot => (
              <button
                key={slot}
                disabled={!cafeteria.isActive}
                onClick={() => {
                  setSelectedTimeSlot(slot);
                  setIsCustomTime(false);
                }}
                className={`flex items-center justify-center h-12 rounded-xl border text-sm font-medium transition-all ${
                  !isCustomTime && selectedTimeSlot === slot 
                    ? "bg-primary/20 border-primary text-primary" 
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                } ${!cafeteria.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {formatTime12h(slot)}
              </button>
            ))}
            <button
              disabled={!cafeteria?.isActive}
              onClick={() => {
                setIsCustomTime(true);
                setSelectedTimeSlot("");
              }}
              className={`flex items-center justify-center h-12 rounded-xl border text-sm font-medium transition-all ${
                isCustomTime 
                  ? "bg-primary/20 border-primary text-primary" 
                  : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
              } ${!cafeteria?.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Custom
            </button>
          </div>

          {isCustomTime && cafeteria?.isActive && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-2"
            >
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Choose your time</label>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-2xl p-2 h-16 w-max">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-600 font-bold uppercase mb-1">Hour</span>
                  <select 
                    value={customHour}
                    onChange={(e) => setCustomHour(e.target.value)}
                    className="bg-transparent text-white font-black text-2xl px-4 outline-none appearance-none cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                      <option key={h} value={h.toString().padStart(2, '0')} className="bg-[#0a0a0a] text-white underline">{h.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                </div>
                <div className="text-2xl font-black text-primary px-2 self-end pb-1">:</div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-600 font-bold uppercase mb-1">Min</span>
                  <select 
                    value={customMinute}
                    onChange={(e) => setCustomMinute(e.target.value)}
                    className="bg-transparent text-white font-black text-2xl px-4 outline-none appearance-none cursor-pointer"
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '59'].map(m => (
                      <option key={m} value={m} className="bg-[#0a0a0a] text-white">{m}</option>
                    ))}
                  </select>
                </div>
                <div className="w-px h-10 bg-white/10 mx-4 self-end mb-2" />
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-gray-600 font-bold uppercase mb-1">Period</span>
                  <select 
                    value={customPeriod}
                    onChange={(e) => setCustomPeriod(e.target.value)}
                    className="bg-transparent text-primary font-black text-2xl px-4 outline-none appearance-none cursor-pointer"
                  >
                    <option value="AM" className="bg-[#0a0a0a] text-white uppercase">AM</option>
                    <option value="PM" className="bg-[#0a0a0a] text-white uppercase">PM</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </section>

        {/* Payment Section */}
        <section className={`space-y-4 pt-2 ${!cafeteria?.isActive ? "opacity-50 pointer-events-none" : ""}`}>
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
                <div className="space-y-2" id="payment-name-input">
                  <label className="text-sm text-gray-400 flex items-center justify-between">
                    <span>Payment Name/Remarks</span>
                    <span className="text-[10px] text-primary font-bold uppercase tracking-widest">Required</span>
                  </label>
                  <Input 
                    placeholder="e.g. John Doe / Burger" 
                    value={paymentName}
                    onChange={(e) => setPaymentName(e.target.value)}
                    required
                  />
                </div>

                {/* Screenshot Upload */}
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                  ref={imageInputRef} 
                  onChange={handleReceiptUpload} 
                />
                <button
                  id="screenshot-upload-btn"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={uploadingReceipt}
                  className={`w-full h-14 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-all ${
                    screenshotUrl 
                      ? "bg-green-500/10 border-green-500/50 text-green-500" 
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white border-primary/20"
                  }`}
                >
                  {uploadingReceipt ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : screenshotUrl ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Screenshot Ready</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="w-5 h-5" />
                      <span>Upload Payment Screenshot</span>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Order Summary */}
        <section className={`bg-white/5 rounded-2xl p-4 space-y-4 ${!cafeteria?.isActive ? "opacity-50" : ""}`}>
          <div className="space-y-3 border-b border-white/5 pb-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-2">Order Details</h3>
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-sm text-gray-400">
                <div className="flex flex-col">
                  <span className="font-bold text-white max-w-[180px] sm:max-w-[220px] truncate">{item.name}</span>
                  <span className="text-[10px] uppercase tracking-wider mt-0.5">RS {item.price} x {cart[item._id]}</span>
                </div>
                <span className="font-black text-white">RS {item.price * cart[item._id]}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-lg font-black pt-1">
            <span>Total Amount</span>
            <span className="text-primary">RS {totalAmount}</span>
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
          disabled={submitting || (!isCustomTime && !selectedTimeSlot) || (isCustomTime && !customTimeValue) || !cafeteria?.isActive}
          onClick={handleSubmit}
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (cafeteria?.isActive ? "Complete Order" : "Ordering Disabled")}
        </Button>
      </div>
      <div className="py-12 flex flex-col items-center justify-center opacity-30">
        <div className="h-px w-24 bg-white/10 mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Powered by MenuQR</p>
      </div>

      {/* Exit Confirmation Modal */}
      <ConfirmationModal
        isOpen={showExitConfirm}
        onClose={() => {
          setShowExitConfirm(false);
          setPendingUrl(null);
        }}
        onConfirm={() => {
          localStorage.removeItem("cart");
          router.push(pendingUrl || `/customer/${adminId}/menu`);
        }}
        title="Wait! Don't lose your delicious picks"
        message="Your cart is full of tasty treats! If you leave now, they'll be cleared. Would you like to stay and finish your order?"
        confirmText="Clear & Exit"
        cancelText="Keep Shopping"
      />
    </div>
  );
}
