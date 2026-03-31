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
  CircleUser,
  Bell,
  Pizza
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { NotificationSheet } from "@/components/NotificationSheet";
import { MenuSkeleton } from "@/components/MenuSkeleton";
import { ItemDetailsModal } from "@/components/ItemDetailsModal";

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
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 50);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const getItemQuantity = (id: string) => cart[id] || 0;
  const cartCount = Object.values(cart).reduce((acc, curr) => acc + curr, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 px-4 pt-4">
        <header className="flex items-center justify-between mb-8 opacity-20">
          <div className="h-8 bg-white/10 rounded-xl w-32" />
          <div className="h-10 bg-white/10 rounded-full w-10" />
        </header>
        <div className="space-y-6">
          <div className="h-10 bg-white/10 rounded-2xl w-3/4" />
          <div className="h-12 bg-white/10 rounded-2xl w-full" />
        </div>
        <MenuSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header - Sticky only on mobile if needed, but lets keep it standard */}
      <header className="p-4 sm:px-6 md:px-8 border-b border-white/5 flex items-center justify-between bg-background/80 backdrop-blur-md sticky top-0 z-[60]">
        <div className="flex items-center gap-3">
          <Pizza className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold tracking-tight">
            {isScrolled ? cafeteria?.name : "Menu"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsNotificationsOpen(true)} 
            className="text-primary p-2 rounded-full relative hover:bg-white/5 transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-background" />
            )}
          </button>
          <button 
            onClick={() => router.push(`/customer/${adminId}/profile`)} 
            className="text-primary p-1 rounded-full hover:bg-white/5 transition-all"
          >
            <CircleUser className="w-7 h-7" />
          </button>
        </div>
      </header>

      <NotificationSheet 
        isOpen={isNotificationsOpen} 
        onClose={() => {
          setIsNotificationsOpen(false);
          markAllAsRead();
        }} 
      />

      <ItemDetailsModal
        item={selectedItem}
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        cartCount={selectedItem ? getItemQuantity(selectedItem._id) : 0}
        onAdd={() => selectedItem && addToCart(selectedItem._id)}
        onRemove={() => selectedItem && removeFromCart(selectedItem._id)}
        isClosed={!cafeteria?.isActive}
      />

      <main className="px-4 sm:px-6 md:px-8 pt-6">
        {/* Hero Section - Fades out on scroll */}
        <motion.div 
          initial={{ opacity: 1 }}
          animate={{ opacity: isScrolled ? 0 : 1, height: isScrolled ? 0 : "auto" }}
          className="mb-8"
        >
          <h2 className="text-4xl font-black tracking-tighter mb-2">
            {cafeteria?.name || "Cafeteria"}
          </h2>
          <p className="text-gray-500 font-medium">Delicious meals pre-prepared for you.</p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search for dishes..." 
            className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl focus:ring-primary/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Bar - Sticky */}
        <div className="sticky top-[72px] z-50 -mx-4 px-4 bg-background border-b border-white/5 py-4 mb-6">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full whitespace-nowrap px-6 transition-all ${
                  activeCategory === cat ? "shadow-lg shadow-primary/20" : "text-gray-500 border-white/10"
                }`}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Closed Banner */}
        {!cafeteria?.isActive && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="text-sm font-black uppercase tracking-widest">Cafeteria is currently closed</p>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`group relative bg-card border border-white/5 rounded-2xl overflow-hidden hover:border-primary/30 transition-all flex h-32 cursor-pointer ${
                !item.isAvailable || !cafeteria?.isActive ? "grayscale opacity-60" : ""
              }`}
              onClick={() => cafeteria?.isActive && setSelectedItem(item)}
            >
              {/* Image - Left Side */}
              <div className="w-28 sm:w-32 h-full relative shrink-0 overflow-hidden">
                <img 
                  src={item.imageUrl || "/placeholder.png"} 
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {!item.isAvailable && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Sold Out</span>
                  </div>
                )}
              </div>

              {/* Content - Right Side */}
              <div className="flex-1 p-4 flex flex-col justify-between min-w-0 bg-[#0a0a0a]">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-base text-white leading-tight truncate">{item.name}</h3>
                  <p className="text-gray-500 text-[10px] line-clamp-2 leading-tight">{item.description}</p>
                </div>
                
                <div className="flex items-center justify-between mt-auto">
                  <p className="text-lg font-black text-primary">RS {item.price}</p>
                  
                  <div onClick={(e) => e.stopPropagation()}>
                    {getItemQuantity(item._id) > 0 ? (
                      <div className="flex items-center gap-2 bg-primary/10 rounded-xl p-0.5 border border-primary/20">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item._id)}
                          className="h-7 w-7 text-primary hover:bg-primary/20 rounded-lg"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-black text-primary text-xs w-4 text-center">{getItemQuantity(item._id)}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addToCart(item._id)}
                          className="h-7 w-7 text-primary hover:bg-primary/20 rounded-lg"
                          disabled={!item.isAvailable}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 px-3 rounded-xl font-black uppercase text-[10px] tracking-wider gap-1.5 shadow-lg shadow-primary/10"
                        onClick={() => addToCart(item._id)}
                        disabled={!item.isAvailable || !cafeteria?.isActive}
                      >
                        <Plus className="w-3 h-3" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="py-20 text-center text-gray-700">
            <Pizza className="w-12 h-12 mx-auto mb-4 opacity-10" />
            <p className="text-xl font-bold italic opacity-20">No items found.</p>
          </div>
        )}
      </main>

      {/* Cart Summary Button */}
      <AnimatePresence>
        {cartCount > 0 && cafeteria?.isActive && !isNotificationsOpen && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50"
          >
            <Button 
              className="w-full max-w-md h-14 rounded-2xl shadow-2xl shadow-primary/40 flex justify-between items-center px-6 bg-primary text-white text-lg font-bold"
              onClick={() => {
                localStorage.setItem("cart", JSON.stringify(cart));
                router.push(`/customer/${adminId}/checkout`);
              }}
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5" />
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

      {/* Simple Footer */}
      <footer className="p-8 mt-12 border-t border-white/5 opacity-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">MenuQR Powered</p>
      </footer>
    </div>
  );
}
