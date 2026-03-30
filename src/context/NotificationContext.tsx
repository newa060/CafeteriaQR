"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Bell, X } from "lucide-react";
import { useAuth } from "./AuthContext";

interface Order {
  _id: string;
  status: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning";
  timestamp: string;
  isRead: boolean;
  role?: "admin" | "customer" | "superadmin";
}

interface NotificationContextType {
  showNotification: (notif: Omit<NotificationItem, "id" | "timestamp" | "isRead"> & { role?: "admin" | "customer" | "superadmin" }) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  playSound: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [activeNotifications, setActiveNotifications] = useState<NotificationItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  // Use a ref so the polling callback always has the latest statuses without stale closure issues
  const isBaselineSet = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Create a userRef to avoid stale closures in components that capture showNotification early
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Load notifications from local storage on mount
  useEffect(() => {
    if (!user?._id) {
      setNotifications([]);
      return;
    }
    const saved = localStorage.getItem(`notifications_${user._id}`);
    if (saved) {
      try {
        setNotifications(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    } else {
      setNotifications([]);
    }
  }, [user?._id]);

  // Save notifications to local storage whenever they change
  useEffect(() => {
    if (user?._id) {
      localStorage.setItem(`notifications_${user._id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?._id]);

  // Clear active toasts when role changes to prevent crosstalk
  useEffect(() => {
    setActiveNotifications([]);
  }, [user?.role]);

  // Preload sound once
  useEffect(() => {
    if (typeof window !== "undefined") {
      audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3");
      audioRef.current.volume = 0.6;
    }
  }, []);

  const playSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const dismiss = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Stable showNotification using functional state update — no stale closure
  const showNotification = useCallback((notif: Omit<NotificationItem, "id" | "timestamp" | "isRead"> & { role?: "admin" | "customer" | "superadmin" }) => {
    // If a role is specified and it doesn't match current user role, don't show the TOAST
    if (notif.role && userRef.current?.role !== notif.role) return;

    const id = Math.random().toString(36).substr(2, 9);
    const newNotif: NotificationItem = {
      ...notif,
      role: notif.role || (userRef.current?.role as any),
      id,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    setActiveNotifications(prev => [...prev, newNotif]);
    setNotifications(prev => [newNotif, ...prev]);
    
    playSound();
    setTimeout(() => dismiss(id), 5000);
  }, [playSound, dismiss]);

  // Use a ref to keep the latest showNotification stable inside setInterval
  const showNotificationRef = useRef(showNotification);
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // Status Polling — runs only for customers
  useEffect(() => {
    if (!user || user.role !== "customer") return;

    // Reset loop baseline when user changes
    isBaselineSet.current = false;

    const pollOrders = async () => {
      try {
        const res = await fetch(`/api/customer/orders?t=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (!res.ok) return;

        const orders: Order[] = await res.json();

        if (!isBaselineSet.current) {
          // First run: just set the baseline
          isBaselineSet.current = true;
          return;
        }

        // Subsequent runs: detect new "Accepted", "Ready", or "Cancelled" statuses
        const notifiedOrders = JSON.parse(localStorage.getItem("notified_orders") || "[]");
        const newNotified = [...notifiedOrders];
        let hasNew = false;

        orders.forEach(order => {
          if (!notifiedOrders.includes(order._id)) {
            if (order.status === "accepted") {
              showNotificationRef.current({
                title: "Order Accepted!",
                message: "Your order has been accepted.",
                type: "success",
                role: "customer"
              });
              newNotified.push(order._id);
              hasNew = true;
            } else if (order.status === "cancelled") {
              showNotificationRef.current({
                title: "Order Rejected",
                message: "Your order receipt could not be verified.",
                type: "warning",
                role: "customer"
              });
              newNotified.push(order._id);
              hasNew = true;
            }
          }
        });

        if (hasNew) {
          // Store last 50 notified order IDs to keep localStorage clean
          localStorage.setItem("notified_orders", JSON.stringify(newNotified.slice(-50)));
        }
      } catch {
        // Silent fail — background polling
      }
    };

    // Run immediately, then every 8 seconds
    pollOrders();
    const interval = setInterval(pollOrders, 8000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => 
      (!n.role || n.role === user?.role) ? { ...n, isRead: true } : n
    ));
  }, [user?.role]);

  const clearNotifications = useCallback(() => {
    setNotifications(prev => prev.filter(n => n.role && n.role !== user?.role));
  }, [user?.role]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const filteredNotifications = notifications.filter(n => !n.role || n.role === user?.role);
  const unreadCount = filteredNotifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      notifications: filteredNotifications, 
      unreadCount, 
      markAllAsRead, 
      clearNotifications,
      removeNotification,
      playSound
    }}>
      {children}

      {/* Fixed Toast Stack */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-sm pointer-events-none">
        <AnimatePresence>
          {activeNotifications.map(notif => (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, y: -40, scale: 0.88 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 350 }}
              className="mb-3 pointer-events-auto"
            >
              <div className="relative bg-zinc-950/85 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] overflow-hidden">
                {/* Top accent bar */}
                <div className={`absolute top-0 left-0 right-0 h-[2px] ${notif.type === "success" ? "bg-gradient-to-r from-green-500 to-emerald-400" : "bg-primary"}`} />

                <div className="flex gap-3 items-start">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${notif.type === "success" ? "bg-green-500/15 text-green-400" : "bg-primary/15 text-primary"}`}>
                    {notif.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 pr-6">
                    <h4 className="text-white font-black text-sm tracking-tight leading-snug">{notif.title}</h4>
                    <p className="text-gray-400 text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>

                  <button
                    onClick={() => dismiss(notif.id)}
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-gray-600 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within a NotificationProvider");
  return context;
};
