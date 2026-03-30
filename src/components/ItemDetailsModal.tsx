import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Plus, Minus, Clock, Flame, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface ItemDetailsModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
  onAdd: () => void;
  onRemove: () => void;
  isClosed: boolean;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  item,
  isOpen,
  onClose,
  cartCount,
  onAdd,
  onRemove,
  isClosed
}) => {
  if (!item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-zinc-950 border-t border-white/10 rounded-t-[3rem] z-[101] overflow-hidden shadow-2xl"
          >
            {/* Top Close Indicator */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 mb-2" onClick={onClose} />
            
            <div className="relative">
              {/* Image Header */}
              <div className="relative h-72 w-full overflow-hidden bg-white/5">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                    <ShoppingCart className="w-16 h-16 text-white/5" />
                  </div>
                )}
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />

                {/* Floating Action Buttons */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="absolute top-4 left-4 flex gap-2 z-10">
                  <div className="bg-primary/20 backdrop-blur-md border border-primary/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Bestseller</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 pt-2 space-y-8 pb-12">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{item.category}</p>
                      <h2 className="text-3xl font-black text-white tracking-tight leading-none">{item.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Price</p>
                      <p className="text-3xl font-black text-primary leading-none italic select-none">RS {item.price}</p>
                    </div>
                  </div>

                  <p className="text-gray-400 text-sm leading-relaxed font-medium">
                    {item.description || "No description provided for this item."}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">10-15 Min Prep</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Always Fresh</span>
                    </div>
                  </div>
                </div>

                {/* Interaction Footer */}
                <div className="pt-6 border-t border-white/5 flex items-center justify-between gap-6">
                  {cartCount > 0 ? (
                    <div className="flex items-center bg-white/5 rounded-[1.5rem] p-1.5 border border-white/10 shadow-lg flex-1">
                      <button 
                        onClick={onRemove}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90"
                      >
                        <Minus className="w-5 h-5" />
                      </button>
                      <span className="flex-1 text-center text-lg font-black text-white">{cartCount}</span>
                      <button 
                        onClick={onAdd}
                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-primary hover:brightness-110 text-white shadow-lg shadow-primary/20 transition-all active:scale-90"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      className="flex-1 h-14 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-lg font-black tracking-tight shadow-xl shadow-primary/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50"
                      onClick={onAdd}
                      disabled={isClosed}
                    >
                      {isClosed ? "Cafeteria Closed" : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          Add to Cart
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
