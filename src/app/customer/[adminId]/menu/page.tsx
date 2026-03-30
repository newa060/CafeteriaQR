"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  ShoppingCart, 
  ArrowLeft, 
  ChevronRight, 
  Loader2,
  Plus,
  Minus,
  LogOut,
  AlertCircle,
  CircleUser,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge"; 
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { NotificationSheet } from "@/components/NotificationSheet";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface Cafeteria {
  _id: string;
  name: string;
  paymentQRUrl?: string;
  timeSlots: string[];
  isActive: boolean;
}

export default function CustomerMenuPage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;
  const { logout } = useAuth();

  const [cafeteria, setCafeteria] = useState<Cafeteria | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const { unreadCount, markAllAsRead } = useNotification();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await fetch(`/api/customer/${adminId}/menu`);
        if (res.ok) {
          const data = await res.json();
          setCafeteria(data.cafeteria);
          setMenuItems(data.menuItems);
          
          const uniqueCategories = ["All", ...Array.from(new Set(data.menuItems.map((item: MenuItem) => item.category))) as string[]];
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error("Failed to fetch menu:", error);
      } finally {
        setLoading(false);
      }
    };

    if (adminId) fetchMenu();
  }, [adminId]);

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (id: string) => {
    setCart(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[id] > 1) {
        newCart[id] -= 1;
      } else {
        delete newCart[id];
      }
      return newCart;
    });
  };

  const cartCount = Object.values(cart).reduce((acc, curr) => acc + curr, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden max-w-lg mx-auto bg-background text-white shadow-2xl">
      {/* Header - Fixed At Top */}
      <div className="flex-none">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 p-3.5 sm:p-4 flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight">Canteen <span className="text-primary">Menu</span></h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(true)} 
              className="text-primary hover:bg-primary/10 p-2 rounded-full transition-all hover:scale-110 active:scale-95 outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </button>
          </div>
          <button 
            onClick={() => router.push(`/customer/${adminId}/profile`)} 
            className="text-primary hover:bg-primary/10 p-1 rounded-full transition-all hover:scale-110 active:scale-95 outline-none"
            aria-label="Profile"
          >
            <CircleUser className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      </header>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">

      <NotificationSheet 
        isOpen={isNotificationsOpen} 
        onClose={() => {
          setIsNotificationsOpen(false);
          markAllAsRead();
        }} 
      />


      {/* Sticky Banner & Categories */}
      <div className="sticky top-[64px] sm:top-[72px] z-40 bg-background/95 backdrop-blur-md border-b border-white/5 shadow-xl">
        {/* Hero / Info */}
        <div className="p-4 pt-6 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-1">{cafeteria?.name || "Cafeteria"}</h2>
          <p className="text-gray-500 text-xs sm:text-sm font-medium">Delicious meals pre-prepared for you.</p>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
            <Input
              type="text"
              placeholder="Search for dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-white/5 border-white/10 rounded-2xl focus:border-primary/50 text-sm sm:text-base placeholder:text-gray-600"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="overflow-x-auto no-scrollbar flex gap-2 px-4 pb-4 py-2 sm:py-4 scroll-smooth">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-5 py-2.5 rounded-full whitespace-nowrap text-xs sm:text-sm font-black uppercase tracking-widest transition-all border ${
                activeCategory === category 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                  : "bg-white/5 border-white/10 text-gray-500 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Grid */}
      <div className="px-4 space-y-4 relative">
        {!cafeteria?.isActive && (
          <div className="absolute inset-0 z-10 flex items-start justify-center pt-20">
            <div className="sticky top-40 bg-red-500/90 backdrop-blur-md text-white p-6 rounded-3xl shadow-2xl border border-white/20 text-center max-w-[280px] animate-in zoom-in-95 duration-300">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-80" />
              <h3 className="text-xl font-black uppercase tracking-tight">Cafeteria Closed</h3>
              <p className="text-sm font-medium mt-2 opacity-90 leading-relaxed">
                We are currently not accepting new orders. Please check back later!
              </p>
            </div>
          </div>
        )}

        {filteredItems.map((item, idx) => (
          <motion.div
            key={item._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={!cafeteria?.isActive ? "grayscale opacity-50 transition-all pointer-events-none" : ""}
          >
            <Card className="group relative overflow-hidden bg-black/40 border-white/5 hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-0 flex flex-row h-32">
                {/* Product Image */}
                <div className="w-1/3 relative h-full bg-white/5">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-gray-700" />
                    </div>
                  )}
                  {/* Glassy overlay for the image when unavailable */}
                  {(!item.isAvailable || !cafeteria?.isActive) && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
                        {!cafeteria?.isActive ? "Closed" : "Out"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-black text-base sm:text-lg leading-tight text-white mb-1">{item.name}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-primary font-black text-base sm:text-lg">RS {item.price}</span>
                    
                    {/* Add to Cart Logic */}
                    <div className="flex items-center gap-3">
                      {cart[item._id] ? (
                        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/10">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item._id);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
                            disabled={!cafeteria?.isActive}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="mx-2 text-sm font-bold min-w-[12px] text-center">{cart[item._id]}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item._id);
                            }}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-primary hover:brightness-110"
                            disabled={!cafeteria?.isActive}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <Button 
                          size="icon" 
                          className="w-9 h-9 rounded-full bg-white/10 hover:bg-primary transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(item._id);
                          }}
                          disabled={!item.isAvailable || !cafeteria?.isActive}
                        >
                          <Plus className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredItems.length === 0 && (
          <div className="py-20 text-center text-gray-500">
            <p className="text-lg">No items found.</p>
          </div>
        )}
      </div>
      </div>

      {/* Sticky Cart Button - Positioned over the fixed footer */}
      <AnimatePresence>
        {cartCount > 0 && !(cafeteria && !cafeteria.isActive) && !isNotificationsOpen && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: -64 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none"
          >
            <Button 
              className="w-full max-w-sm h-14 rounded-2xl shadow-2xl shadow-primary/40 flex justify-between items-center px-6 pointer-events-auto bg-primary text-white text-lg font-bold"
              onClick={() => {
                localStorage.setItem("cart", JSON.stringify(cart));
                router.push(`/customer/${adminId}/checkout`);
              }}
            >
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span>View Cart</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/60 text-sm font-normal">({cartCount} items)</span>
                <ChevronRight className="w-6 h-6" />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Footer At Bottom */}
      <div className="flex-none p-6 bg-zinc-950 border-t border-white/5 relative z-20">
        <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">
          Powered by MenuQR
        </p>
      </div>
    </div>
  );
}
