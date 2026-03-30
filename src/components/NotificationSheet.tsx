"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  CheckCheck,
  BellOff
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useNotification } from "@/context/NotificationContext";

interface NotificationSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSheet: React.FC<NotificationSheetProps> = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    markAllAsRead, 
    clearNotifications, 
    removeNotification,
    unreadCount 
  } = useNotification();

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

          {/* Sheet */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-zinc-950 border-l border-white/10 z-[101] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-950 sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="w-6 h-6 text-primary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-zinc-950" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white">Notifications</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {unreadCount} unread messages
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Actions */}
            {notifications.length > 0 && (
              <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 flex items-center gap-2 h-8"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all as read
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearNotifications}
                  className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-400 hover:bg-red-400/10 flex items-center gap-2 h-8"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </Button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                      notif.isRead 
                        ? "bg-transparent border-white/5 opacity-60" 
                        : "bg-white/[0.03] border-white/10 shadow-lg shadow-black/20"
                    }`}
                  >
                    {!notif.isRead && (
                      <div className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.type === "success" ? "bg-green-500/10 text-green-400" : "bg-primary/10 text-primary"
                      }`}>
                        {notif.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                      </div>
                      
                      <div className="flex-1 min-w-0 pr-6">
                        <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                          {notif.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-gray-600" />
                          <span className="text-[10px] font-medium text-gray-600">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                  <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-6">
                    <BellOff className="w-10 h-10" />
                  </div>
                  <h3 className="text-lg font-bold text-white uppercase tracking-widest">No Notifications</h3>
                  <p className="text-xs font-medium text-gray-500 mt-2 max-w-[200px] mx-auto leading-relaxed">
                    When your orders are accepted or prepared, you'll see them here.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-950 border-t border-white/5 relative z-20">
              <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-700">
                Powered by MenuQR
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
