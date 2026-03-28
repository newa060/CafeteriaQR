"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Coffee, 
  Search, 
  ArrowRight, 
  Loader2, 
  Store,
  QrCode,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function CustomerLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [canteenCode, setCanteenCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          
          // If already has a canteen, redirect to menu
          if (data.user.adminId) {
            router.push(`/customer/${data.user.adminId}/menu`);
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleJoinCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteenCode.trim()) return;

    setJoining(true);
    setError("");

    try {
      const res = await fetch("/api/customer/join-canteen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canteenCode: canteenCode.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/customer/${data.adminId}/menu`);
      } else {
        setError(data.error || "Failed to join canteen");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d] text-white">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="bg-[#ff6b00]/10 p-5 rounded-3xl mb-4 border border-[#ff6b00]/20"
        >
          <Coffee className="w-12 h-12 text-[#ff6b00]" />
        </motion.div>
        <Loader2 className="w-8 h-8 animate-spin text-[#ff6b00]/50" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white p-6 flex flex-col items-center justify-center max-w-lg mx-auto">
      {/* Background Glow */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ff6b00]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ff6b00]/05 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center space-y-8 relative z-10"
      >
        <div className="space-y-3">
          <div className="flex justify-center mb-6">
            <div className="bg-[#ff6b00] p-4 rounded-2xl shadow-xl shadow-[#ff6b00]/20">
              <Store className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tight">
            Welcome to <span className="text-[#ff6b00]">Canteen QR</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-[280px] mx-auto">
            Experience the future of campus dining. Fast, easy, and contactless.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Join Your Canteen</h2>
              <p className="text-sm text-gray-500">Enter the unique code from your cafeteria table.</p>
            </div>

            <form onSubmit={handleJoinCanteen} className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="e.g. COLLEGE-01"
                  value={canteenCode}
                  onChange={(e) => setCanteenCode(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-lg font-mono tracking-wider outline-none focus:border-[#ff6b00]/50 focus:bg-white/[0.05] transition-all placeholder:text-gray-600"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <QrCode className="w-5 h-5 text-gray-600 group-focus-within:text-[#ff6b00]/50 transition-colors" />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 text-red-500 text-sm italic"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button
                type="submit"
                disabled={joining || !canteenCode.trim()}
                className="w-full h-14 bg-[#ff6b00] hover:bg-[#ff8000] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#ff6b00]/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                {joining ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    Connect to Canteen
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="pt-4">
          <p className="text-gray-600 text-xs">
            Scan the QR code on your table to join automatically
          </p>
        </div>
      </motion.div>
    </div>
  );
}
