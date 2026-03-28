"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
  Info
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { CldUploadWidget } from "next-cloudinary";

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
  const [newSlot, setNewSlot] = useState("");

  useEffect(() => {
    const fetchCafeteria = async () => {
      try {
        const res = await fetch("/api/admin/cafeteria");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setCafeteria(data);
            setName(data.name || "");
            setPaymentQRUrl(data.paymentQRUrl || "");
            setTimeSlots(data.timeSlots || []);
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
    if (newSlot && !timeSlots.includes(newSlot)) {
      setTimeSlots([...timeSlots, newSlot].sort());
      setNewSlot("");
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

    try {
      const res = await fetch("/api/admin/cafeteria", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, paymentQRUrl, timeSlots }),
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
    <div className="space-y-10 max-w-4xl mx-auto pb-20">
      <div>
        <h1 className="text-4xl font-extrabold text-white leading-none">Settings</h1>
        <p className="text-gray-500 font-medium mt-2">Manage your cafeteria profile, payment logic, and operational hours.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Profile Settings */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Info className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white">Cafeteria Profile</h2>
          </div>
          <Card className="bg-[#111111] border-white/5 p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Cafeteria Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main High School Canteen" required />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Canteen Code</label>
                  <Input value={cafeteria?.canteenCode} disabled className="opacity-50 select-none bg-white/5 border-white/5" />
                  <p className="text-[10px] text-gray-600 mt-1 pl-1 italic">This code is unique and cannot be changed.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Status</label>
                  <div className="h-12 bg-white/5 border border-white/10 rounded-xl px-4 flex items-center justify-between">
                    <span className="text-sm font-bold text-white uppercase tracking-widest">{cafeteria?.isActive ? "Active" : "Inactive"}</span>
                    <div className={`w-2 h-2 rounded-full ${cafeteria?.isActive ? "bg-green-500" : "bg-red-500"}`} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Payment Setup */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-white">Payment Gateway</h2>
          </div>
          <Card className="bg-[#111111] border-white/5 p-8 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <p className="text-sm text-gray-400 leading-relaxed">
                  Upload your payment QR image (e.g., eSewa, Khalti, or Bank QR). It will be displayed to customers during checkout.
                </p>
                
                <CldUploadWidget 
                  uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                  onSuccess={(result: any) => setPaymentQRUrl(result.info.secure_url)}
                >
                  {({ open }) => (
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold tracking-wide"
                      onClick={() => open()}
                    >
                      <QrCode className="w-5 h-5 mr-3" />
                      {paymentQRUrl ? "Change Payment QR" : "Upload Payment QR"}
                    </Button>
                  )}
                </CldUploadWidget>
              </div>

              <div className="flex justify-center">
                {paymentQRUrl ? (
                  <div className="relative group">
                    <img src={paymentQRUrl} alt="Payment QR Preview" className="w-44 h-44 object-contain rounded-2xl bg-white p-2 shadow-2xl ring-4 ring-primary/20" />
                    <button 
                      type="button" 
                      onClick={() => setPaymentQRUrl("")}
                      className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform"
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
            <h2 className="text-xl font-bold text-white">Daily Time Slots</h2>
          </div>
          <Card className="bg-[#111111] border-white/5 p-8 shadow-2xl">
            <div className="space-y-6">
              <div className="flex gap-4">
                <Input 
                  type="time" 
                  value={newSlot} 
                  onChange={(e) => setNewSlot(e.target.value)}
                  className="max-w-[180px]"
                />
                <Button type="button" onClick={handleAddSlot} className="h-12 px-6 rounded-xl font-bold">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Slot
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {timeSlots.map(slot => (
                  <div 
                    key={slot} 
                    className="flex items-center justify-between h-12 bg-white/5 border border-white/5 rounded-xl px-4 group hover:border-primary/30 transition-all"
                  >
                    <span className="text-sm font-bold text-white">{slot}</span>
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
            className="w-full h-16 rounded-2xl text-xl font-black shadow-2xl shadow-primary/30 flex items-center justify-center gap-3"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Save All Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
}
