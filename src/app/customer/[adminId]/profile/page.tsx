"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  CircleUser, 
  History, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  XCircle,
  AlertCircle,
  Loader2,
  User as UserIcon,
  GraduationCap,
  Trash2,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { NotificationSheet } from "@/components/NotificationSheet";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  timeSlot: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function CustomerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const adminId = params.adminId as string;
  const { user, logout, refreshUser } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [faculty, setFaculty] = useState(user?.faculty || "");
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const { unreadCount, markAllAsRead } = useNotification();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setFaculty(user.faculty || "");
    }
  }, [user]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/customer/orders?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoadingOrders(false);
      }
    };

    fetchOrders();
  }, []);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    setMessage("");
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      setUpdating(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "x-panel-context": "customer"
        },
        body: JSON.stringify({ name, faculty }),
      });

      if (res.ok) {
        await refreshUser();
        setMessage("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError("Failed to update profile");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'pending': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'cancelled': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setIsDeletingId(orderId);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`/api/customer/orders/${orderId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOrders(prev => prev.filter(order => order._id !== orderId));
        setMessage("Order removed from history");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to remove entry");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleClearHistory = async () => {
    setIsClearing(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/customer/orders", {
        method: "DELETE",
      });

      if (res.ok) {
        setOrders([]);
        setShowAllHistory(false);
        setMessage("All history cleared successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setError("Failed to clear history");
      }
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background text-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold">Profile</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button 
              onClick={() => setIsNotificationsOpen(true)} 
              className="text-primary hover:bg-primary/10 p-1.5 rounded-full transition-all hover:scale-110 active:scale-95 outline-none"
              aria-label="Notifications"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </button>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirm(true)} className="text-red-500 hover:bg-red-500/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <NotificationSheet 
        isOpen={isNotificationsOpen} 
        onClose={() => {
          setIsNotificationsOpen(false);
          markAllAsRead();
        }} 
      />

      <div className="flex-1 w-full max-w-lg mx-auto p-4 space-y-8 relative">
        {/* User Card - FIXED/STICKY */}
        <section className="sticky top-[72px] z-40 bg-background/95 backdrop-blur-md pt-2 pb-6 -mx-4 px-4 border-b border-white/5 shadow-xl">
          <div className="relative">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            <Card className="bg-black/40 border-white/5 shadow-2xl overflow-hidden backdrop-blur-sm rounded-[2rem]">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary to-orange-400 p-1">
                      <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden border-2 border-zinc-950">
                        <CircleUser className="w-14 h-14 text-primary/50" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tight leading-none">{user?.name}</h2>
                    <p className="text-xs text-gray-500 font-medium">{user?.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full pt-1">
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Orders</p>
                      <p className="text-lg font-black text-white">{orders.length}</p>
                    </div>
                    <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                      <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Faculty</p>
                      <p className="text-lg font-black text-white truncate">{user?.faculty || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Profile Settings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Personal Details</h3>
            </div>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="text-xs font-bold text-primary hover:bg-primary/10"
              >
                Edit Profile
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card className="bg-[#111111] border-white/5 p-6 shadow-xl">
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <UserIcon className="w-3 h-3" /> Full Name
                      </label>
                      <Input 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="h-12 bg-white/5 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 pl-1">
                        <GraduationCap className="w-3 h-3" /> Faculty
                      </label>
                      <Input 
                        value={faculty} 
                        onChange={(e) => setFaculty(e.target.value)} 
                        placeholder="e.g. Science, Arts"
                        className="h-12 bg-white/5 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => setIsEditing(false)}
                        className="flex-1 h-12 rounded-xl text-gray-400 font-bold"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleUpdateProfile}
                        disabled={updating}
                        className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/20"
                      >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-xs p-3 rounded-xl flex items-center gap-2 animate-in fade-in zoom-in-95">
              <CheckCircle2 className="w-4 h-4" /> {message}
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}
        </section>

        {/* Order History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Recent Orders</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowClearConfirm(true)}
                disabled={isClearing || loadingOrders || orders.length === 0}
                className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 h-8 px-2 rounded-lg"
              >
                {isClearing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Trash2 className="w-3 h-3 mr-1" />}
                Clear All
              </Button>
              {orders.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowAllHistory(true)}
                  className="text-xs font-bold text-primary hover:bg-primary/10"
                >
                  See All
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading History...</p>
              </div>
            ) : orders.length > 0 ? (
              <div className="space-y-4 flex flex-col items-stretch">
                {orders.slice(0, 3).map((order, idx) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="bg-white/5 border-white/5 hover:border-white/10 transition-colors shadow-lg group overflow-hidden">
                      <div className="flex items-stretch min-h-[100px]">
                        <div className={`w-1 ${
                          order.status === 'completed' ? 'bg-green-500' : 
                          order.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                        }`} />
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className="text-[8px] font-black text-gray-500 uppercase tracking-tighter truncate">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                              <h4 className="font-bold text-sm text-white flex items-center gap-1.5 flex-wrap">
                                Slot: {order.timeSlot}
                                <Badge className={`h-4 px-1.5 text-[7px] font-black uppercase ${getStatusColor(order.status)} border-none`}>
                                  {order.status}
                                </Badge>
                              </h4>
                            </div>
                            <p className="text-base sm:text-lg font-black text-primary whitespace-nowrap shrink-0 mt-0.5">RS {order.totalAmount}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-1.5">
                            {order.items.map((item, i) => (
                              <span key={i} className="text-[9px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-gray-400 font-medium">
                                {item.quantity}x {item.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-center px-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isDeletingId === order._id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteOrder(order._id);
                            }}
                            className="w-8 h-8 text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            {isDeletingId === order._id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center space-y-4 bg-white/5 rounded-3xl border border-dashed border-white/10">
                <History className="w-10 h-10 text-gray-700 mx-auto" />
                <div className="space-y-1">
                  <p className="text-gray-500 font-bold">No orders found yet.</p>
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest">Your future delicious meals will appear here!</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => router.push(`/customer/${adminId}/menu`)}
                  className="rounded-xl border-white/10 bg-white/5 font-bold"
                >
                  Browse Menu
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showAllHistory && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[120] bg-background overflow-hidden flex flex-col"
          >
            {/* Full History Header */}
            <header className="p-4 border-b border-white/5 flex items-center justify-between bg-background/80 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => setShowAllHistory(false)}>
                  <ArrowLeft className="w-6 h-6" />
                </Button>
                <h2 className="text-xl font-bold">Complete History</h2>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowClearConfirm(true)}
                  disabled={isClearing || orders.length === 0}
                  className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 h-8 px-3 rounded-xl border border-red-500/10"
                >
                  {isClearing ? <Loader2 className="w-3 h-3 animate-spin mr-1.5" /> : <Trash2 className="w-3 h-3 mr-1.5" />}
                  Clear History
                </Button>
              </div>
            </header>

            {/* List */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
              {orders.map((order, idx) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="bg-white/5 border-white/5 shadow-xl overflow-hidden">
                    <div className="flex items-stretch min-h-[110px]">
                      <div className={`w-1.5 ${
                        order.status === 'completed' ? 'bg-green-500' : 
                        order.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div className="flex-1 p-5">
                        <div className="flex justify-between items-start gap-3 mb-4">
                          <div className="space-y-1 min-w-0 flex-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">
                              {new Date(order.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-lg font-black text-white">Slot {order.timeSlot}</h4>
                              <Badge className={`px-2 py-0.5 text-[9px] font-black uppercase ${getStatusColor(order.status)}`}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-xl sm:text-2xl font-black text-primary whitespace-nowrap shrink-0 mt-0.5">RS {order.totalAmount}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, i) => (
                            <div key={i} className="bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-2">
                              <span className="text-primary font-black">{item.quantity}x</span>
                              <span className="text-gray-300 font-bold">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-center px-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeletingId === order._id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order._id);
                          }}
                          className="w-10 h-10 text-gray-600 hover:text-red-500 hover:bg-red-500/10 transition-all"
                        >
                          {isDeletingId === order._id ? (
                            <Loader2 className="w-5 h-5 animate-spin text-red-500" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-zinc-950 border-t border-white/5 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">
                End of History
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto pt-10 pb-4 flex flex-col items-center justify-center opacity-30">
        <div className="h-px w-24 bg-white/10 mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-[0.3em]">Powered by MenuQR</p>
      </div>
      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={logout} 
      />

      {/* Clear History Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowClearConfirm(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-sm bg-[#111111] border border-white/10 rounded-[2rem] p-6 shadow-2xl flex flex-col items-center text-center overflow-hidden"
            >
              {/* Background gradient hint */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-500/20 blur-[60px] rounded-full pointer-events-none" />
              
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 mt-2 relative z-10 border border-red-500/20 shadow-inner">
                <Trash2 className="w-8 h-8 text-red-500 drop-shadow-lg" />
              </div>
              
              <div className="relative z-10 mb-8">
                <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Clear Entire History?</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-[280px]">
                  This will permanently delete all your order records. This action cannot be undone. Are you absolutely sure?
                </p>
              </div>

              <div className="flex gap-4 w-full relative z-10">
                <Button 
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold"
                  onClick={() => setShowClearConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 h-14 rounded-2xl bg-red-600 hover:bg-red-500 border-none text-white font-black shadow-xl shadow-red-500/30"
                  onClick={() => {
                    setShowClearConfirm(false);
                    handleClearHistory();
                  }}
                  disabled={isClearing}
                >
                  Yes, Clear All
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
