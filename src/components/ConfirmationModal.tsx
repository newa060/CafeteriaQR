"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Wait! Your Cart is Full",
  message = "You have delicious items in your cart. If you leave now, they will be discarded. Are you sure you want to exit?",
  confirmText = "Discard & Exit",
  cancelText = "Keep Shopping",
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[101] p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl pointer-events-auto overflow-hidden relative"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50" />
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-2">
                  <ShoppingCart className="w-8 h-8" />
                </div>
                
                <h3 className="text-xl font-bold text-white tracking-tight leading-tight">
                  {title}
                </h3>
                
                <p className="text-gray-400 text-sm leading-relaxed">
                  {message}
                </p>
                
                <div className="flex flex-col w-full gap-2 mt-6">
                  <Button 
                    onClick={onConfirm}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-white/10 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 font-bold transition-all"
                  >
                    {confirmText}
                  </Button>
                  <Button 
                    onClick={onClose}
                    className="w-full h-12 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
                  >
                    {cancelText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
