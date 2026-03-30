"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Settings as SettingsIcon, 
  CreditCard, 
  Clock, 
  Plus, 
  Trash2, 
  Loader2, 
  QrCode, 
  Check, 
  AlertCircle,
  Coffee,
  Info,
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useRef } from "react";

const formatTime12h = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  if (!h || !m) return time24;
  let hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour.toString().padStart(2, "0")}:${m} ${period}`;
};

export default function AdminSettingsPage() {
  const [cafeteria, setCafeteria] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  // Form fields
  const [name, setName] = useState("");
  const [paymentQRUrl, setPaymentQRUrl] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [newSlotHour, setNewSlotHour] = useState("09");
  const [newSlotMinute, setNewSlotMinute] = useState("00");
  const [newSlotPeriod, setNewSlotPeriod] = useState("AM");
  const [isQRDeleteModalOpen, setIsQRDeleteModalOpen] = useState(false);
  
  // Custom uploader states
  const qrInputRef = useRef<HTMLInputElement>(null);
  const [uploadingQR, setUploadingQR] = useState(false);

  const handleQRUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQR(true);
    const formData = new FormData();
    formData.append("file", file);
    // Use fallback if env is missing
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "CafeteriaQR");

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "da5jaib7d"}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setPaymentQRUrl(data.secure_url);
      } else {
        setError("Failed to upload image.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error uploading the image.");
    } finally {
      setUploadingQR(false);
      if (qrInputRef.current) qrInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const fetchCafeteria = async () => {
      try {
        const res = await fetch("/api/admin/cafeteria", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setCafeteria(data);
            setName(data.name || "");
            setPaymentQRUrl(data.paymentQRUrl || "");
            setTimeSlots(data.timeSlots || []);
            setIsActive(data.isActive ?? true);
          } else {
            console.error("Cafeteria data is null");
            setError("Cafeteria profiles are currently unavailable for this account.");
          }
        } else {
          setError("Failed to fetch cafeteria details. Please refresh or try again.");
        }
      } catch (err) {
        console.error("Failed to fetch cafeteria:", err);
        setError("Something went wrong while loading your cafeteria settings.");
      } finally {
        setLoading(false);
      }
    };


    fetchCafeteria();
  }, []);

  const handleAddSlot = () => {
    let hour = parseInt(newSlotHour);
    if (newSlotPeriod === "PM" && hour !== 12) hour += 12;
    if (newSlotPeriod === "AM" && hour === 12) hour = 0;
    
    const slot = `${hour.toString().padStart(2, '0')}:${newSlotMinute}`;
    if (slot && !timeSlots.includes(slot)) {
      setTimeSlots([...timeSlots, slot].sort());
    }
  };

  const handleRemoveSlot = (slot: string) => {
    setTimeSlots(timeSlots.filter(s => s !== slot));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Cafeteria name is required");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/cafeteria", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, paymentQRUrl, timeSlots, isActive }),
      });

      if (res.ok) {
        setMessage("Settings updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError("Failed to update settings");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-4xl mx-auto pb-20 lg:pt-0">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">Settings</h1>
        <p className="text-[11px] sm:text-base text-gray-500 font-medium mt-2">Manage your cafeteria profile, payment logic, and operational hours.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Cafeteria Profile</h2>
          </div>
          <Card className="bg-[#111111] border-white/5 p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Cafeteria Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main High School Canteen" required />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Canteen Code</label>
                  <Input value={cafeteria?.canteenCode} disabled className="h-12 opacity-50 select-none bg-white/5 border-white/5" />
                  <p className="text-[10px] text-gray-600 mt-1 pl-1 italic">This code is unique and cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Status</label>
                  <button 
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center justify-between hover:bg-white/10 transition-colors group"
                  >
                    <span className={`text-xs font-black uppercase tracking-widest ${isActive ? "text-green-500" : "text-red-500"}`}>
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    <div className={`w-3.5 h-3.5 rounded-full shadow-lg ${isActive ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"} transition-all duration-300`} />
                  </button>
                  <p className="text-[10px] text-gray-600 mt-1 pl-1 italic">Click to toggle your canteen's availability.</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Payment Setup */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Payment Gateway</h2>
          </div>
          <Card className="bg-[#111111] border-white/5 p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Upload your payment QR image (e.g., eSewa, Khalti, or Bank QR). It will be displayed to customers during checkout.
                </p>
                
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  className="hidden" 
                  ref={qrInputRef} 
                  onChange={handleQRUpload} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full h-11 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 text-white text-sm font-bold tracking-wide transition-all"
                  onClick={() => qrInputRef.current?.click()}
                  disabled={uploadingQR}
                >
                  {uploadingQR ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                  ) : (
                    <><QrCode className="w-4 h-4 mr-2" /> {paymentQRUrl ? "Change QR" : "Upload QR"}</>
                  )}
                </Button>
              </div>

              <div className="flex justify-center">
                {paymentQRUrl ? (
                  <div className="relative group">
                    <img src={paymentQRUrl} alt="Payment QR Preview" className="w-44 h-44 object-contain rounded-2xl bg-white p-2 shadow-2xl ring-4 ring-primary/20" />
                    <button 
                      type="button" 
                      onClick={() => setIsQRDeleteModalOpen(true)}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-44 h-44 rounded-2xl bg-white/5 border border-dashed border-white/10 flex flex-col items-center justify-center opacity-30">
                    <QrCode className="w-12 h-12 mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">No QR Image</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        {/* Time Slots */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-white">Daily Time Slots</h2>
          </div>
          <Card className="bg-[#111111] border-white/5 p-5 sm:p-6 shadow-2xl rounded-2xl">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full">
                <div className="flex-1 flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-1 h-12">
                  <select 
                    value={newSlotHour}
                    onChange={(e) => setNewSlotHour(e.target.value)}
                    className="bg-transparent text-white font-black px-4 outline-none appearance-none cursor-pointer text-base sm:text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => (
                      <option key={h} value={h.toString().padStart(2, '0')} className="bg-[#0a0a0a] text-white">{h.toString().padStart(2, '0')}</option>
                    ))}
                  </select>
                  <span className="text-gray-500 font-bold px-1">:</span>
                  <select 
                    value={newSlotMinute}
                    onChange={(e) => setNewSlotMinute(e.target.value)}
                    className="bg-transparent text-white font-black px-4 outline-none appearance-none cursor-pointer text-base sm:text-sm"
                  >
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map(m => (
                      <option key={m} value={m} className="bg-[#0a0a0a] text-white">{m}</option>
                    ))}
                  </select>
                  <div className="w-px h-6 bg-white/10 mx-2" />
                  <select 
                    value={newSlotPeriod}
                    onChange={(e) => setNewSlotPeriod(e.target.value)}
                    className="bg-transparent text-primary font-black px-4 outline-none appearance-none cursor-pointer text-base sm:text-sm"
                  >
                    <option value="AM" className="bg-[#0a0a0a] text-white uppercase">AM</option>
                    <option value="PM" className="bg-[#0a0a0a] text-white uppercase">PM</option>
                  </select>
                </div>
                <Button type="button" onClick={handleAddSlot} className="h-11 px-6 rounded-xl font-bold text-base shadow-xl shadow-primary/20 shrink-0 w-full sm:w-auto">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Slot
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {timeSlots.map(slot => (
                  <div 
                    key={slot} 
                    className="flex items-center justify-between h-12 bg-white/5 border border-white/5 rounded-xl px-4 group hover:border-primary/30 transition-all font-mono"
                  >
                    <span className="text-sm font-bold text-white">{formatTime12h(slot)}</span>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSlot(slot)}
                      className="text-gray-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <p className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1.5 pl-1 pt-2">
                <Info className="w-3.5 h-3.5" />
                These slots will be available for customers to choose during checkout.
              </p>
            </div>
          </Card>
        </section>

        {/* Form Feedback & Submit */}
        <div className="flex flex-col gap-4">
          {message && (
            <div className="flex items-center gap-2 text-green-500 text-sm bg-green-500/10 p-4 rounded-2xl border border-green-500/20 animate-in fade-in slide-in-from-bottom-2">
              <Check className="w-5 h-5" />
              {message}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-4 rounded-2xl border border-red-500/20">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-14 rounded-xl text-lg font-bold shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save All Settings"}
          </Button>
        </div>
      </form>
      
      {/* QR Delete Confirmation Modal */}
      <AnimatePresence>
        {isQRDeleteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-lg"
              onClick={() => setIsQRDeleteModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                transition: { type: "spring", damping: 25, stiffness: 400 }
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
            >
              {/* Decoration */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
              
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/5">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Remove QR Code?</h3>
                  <p className="text-gray-500 text-sm leading-relaxed px-4">
                    Are you sure you want to delete your payment QR image? Customers won't see it during checkout.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button 
                    variant="default"
                    className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest text-xs shadow-xl shadow-red-600/20 transition-all active:scale-95"
                    onClick={() => {
                      setPaymentQRUrl("");
                      setIsQRDeleteModalOpen(false);
                    }}
                  >
                    Yes, Delete QR
                  </Button>
                  <Button 
                    variant="ghost"
                    className="w-full h-12 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 font-bold uppercase tracking-widest text-[10px] transition-colors"
                    onClick={() => setIsQRDeleteModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
