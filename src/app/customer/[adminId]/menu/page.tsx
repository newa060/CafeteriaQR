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
    const handleScroll = () => {
      if (window.scrollY > 80) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
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

  const cartCount = Object.values(cart).reduce((acc, curr) => acc + curr, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="p-4 border-b border-white/5 opacity-20">
          <div className="h-8 bg-white/10 rounded-xl w-32" />
        </header>
        <div className="p-4 pt-8 space-y-6">
          <div className="space-y-2">
            <div className="h-10 bg-white/10 rounded-2xl w-3/4" />
            <div className="h-4 bg-white/10 rounded-lg w-1/2" />
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-white/10 rounded-full w-24 shrink-0" />)}
          </div>
        </div>
        <MenuSkeleton />
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-lg mx-auto bg-background text-white min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-[60] bg-background/80 backdrop-blur-xl border-b border-white/5 p-3.5 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isScrolled && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="p-1 hover:bg-white/5 rounded-full"
            >
              <ArrowLeft className="w-5 h-5 text-primary rotate-90" />
            </motion.button>
          )}
          <h1 className={`${isScrolled ? "text-base" : "text-lg sm:text-xl"} font-bold tracking-tight transition-all`}>
            {isScrolled ? cafeteria?.name : <>Canteen <span className="text-primary">Menu</span></>}
          </h1>
        </div>
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
        cartCount={selectedItem ? (cart[selectedItem._id] || 0) : 0}
        onAdd={() => selectedItem && addToCart(selectedItem._id)}
        onRemove={() => selectedItem && removeFromCart(selectedItem._id)}
        isClosed={!cafeteria?.isActive}
      />


      {/* Sticky Banner & Categories */}
      <div className="sticky top-[58px] sm:top-[68px] z-50 bg-background/95 backdrop-blur-md border-b border-white/5 shadow-xl transition-all duration-300">
        {/* Hero / Info - Hidden on scroll */}
        <AnimatePresence>
          {!isScrolled && (
            <motion.div 
              initial={{ height: "auto", opacity: 1 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Categories */}
        <div className="overflow-x-auto no-scrollbar flex gap-2 px-4 pb-4 py-2 sm:py-4 scroll-smooth">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`relative px-5 py-2.5 rounded-full whitespace-nowrap text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all z-10 ${
                activeCategory === category 
                  ? "text-white" 
                  : "text-gray-500 hover:text-white"
              }`}
            >
              {activeCategory === category && (
                <motion.div
                  layoutId="activeCategory"
                  className="absolute inset-0 bg-primary rounded-full -z-10 shadow-lg shadow-primary/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, type: "spring", stiffness: 260, damping: 20 }}
            whileHover={{ scale: cafeteria?.isActive ? 1.02 : 1 }}
            className={!cafeteria?.isActive ? "grayscale opacity-50 transition-all pointer-events-none" : ""}
            onClick={() => cafeteria?.isActive && setSelectedItem(item)}
          >
            <Card className="group relative overflow-hidden bg-white/5 border-white/10 hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300 rounded-[2rem] cursor-pointer">
              <CardContent className="p-0 flex flex-row h-36">
                {/* Product Image */}
                <div className="w-[38%] relative h-full bg-white/5 overflow-hidden">
                  {item.imageUrl ? (
                    <motion.img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/5 to-white/10">
                      <ShoppingCart className="w-8 h-8 text-white/10" />
                    </div>
                  )}
                  
                  {/* Category Badge on Image */}
                  <div className="absolute top-3 left-3">
                    <div className="px-2 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                      <p className="text-[8px] font-black uppercase tracking-widest text-white/70">{item.category}</p>
                    </div>
                  </div>

                  {(!item.isAvailable || !cafeteria?.isActive) && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] flex items-center justify-center">
                      <div className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-full">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                          {!cafeteria?.isActive ? "Closed" : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 p-5 flex flex-col justify-between relative">
                  {/* Subtle Background Glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

                  <div className="space-y-1.5 relative">
                    <h3 className="font-black text-base sm:text-lg leading-tight text-white group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 line-clamp-2 leading-relaxed font-medium">{item.description}</p>
                  </div>

                  <div className="flex items-center justify-between mt-auto relative">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">Price</span>
                      <span className="text-primary font-black text-lg sm:text-xl leading-none">RS {item.price}</span>
                    </div>
                    
                    {/* Add to Cart Logic */}
                    <div className="flex items-center gap-3">
                      {cart[item._id] ? (
                        <motion.div 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/10 shadow-lg"
                        >
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromCart(item._id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                            disabled={!cafeteria?.isActive}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="mx-3 text-sm font-black min-w-[14px] text-center text-white">{cart[item._id]}</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item._id);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary hover:brightness-110 text-white shadow-lg shadow-primary/20 transition-all active:scale-90"
                            disabled={!cafeteria?.isActive}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Button 
                            className="h-10 px-5 rounded-2xl bg-white/5 hover:bg-primary border border-white/10 hover:border-primary text-[10px] font-black uppercase tracking-[0.1em] transition-all shadow-lg group-hover:border-primary/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item._id);
                            }}
                            disabled={!item.isAvailable || !cafeteria?.isActive}
                          >
                            Add to Cart
                          </Button>
                        </motion.div>
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
