"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, UtensilsCrossed, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OrderSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Aesthetic Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-green-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/05 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="w-full max-w-md text-center space-y-8 relative z-10"
      >
        {/* Success Icon Animation */}
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 12, stiffness: 200 }}
            className="relative"
          >
            <div className="w-32 h-32 rounded-[2.5rem] bg-green-500/20 flex items-center justify-center border border-green-500/30">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            {/* Pulsing ring effect */}
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-[2.5rem] border-2 border-green-500/50"
            />
          </motion.div>
        </div>

        <div className="space-y-3">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-black tracking-tight"
          >
            Your order is placed <br />
            <span className="text-green-500">successfully</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 text-lg mx-auto max-w-[280px]"
          >
            You will get notification after the order is accepted!!
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="pt-4"
        >
          <Button 
            className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-xl shadow-2xl shadow-white/10 flex items-center justify-center gap-3 active:scale-95 transition-all group"
            onClick={() => router.push(`/customer/${adminId}/menu`)}
          >
            <UtensilsCrossed className="w-6 h-6" />
            Browse Menu
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        {/* Brand Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="pt-12 opacity-30 flex flex-col items-center"
        >
          <div className="h-px w-24 bg-white/10 mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Powered by MenuQR</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
