"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ 
              scale: 1, 
              opacity: 1, 
              y: 0,
              transition: { type: "spring", damping: 20, stiffness: 300 }
            }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-sm bg-[#0d0d0d] border border-white/10 rounded-[2.5rem] p-10 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {/* Top Accent Bar */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-6 relative z-10 pt-4">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto shadow-xl shadow-red-500/10 rotate-3">
                <LogOut className="w-10 h-10 text-red-500" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white tracking-tight">Sign Out?</h3>
                <p className="text-gray-400 text-sm leading-relaxed px-2">
                  Are you sure you want to log out of your account?
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  className="w-full h-14 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-lg shadow-xl shadow-red-600/30 active:scale-95 transition-all"
                  onClick={onConfirm}
                >
                  Yes, Sign Out
                </Button>
                <Button
                  variant="ghost"
                  className="w-full h-12 rounded-xl text-gray-500 hover:text-white hover:bg-white/5 font-bold transition-colors"
                  onClick={onClose}
                >
                  Stay logged in
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
