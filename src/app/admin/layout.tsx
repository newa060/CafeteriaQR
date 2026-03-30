"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Utensils, Settings, QrCode, Menu as MenuIcon, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { LogoutConfirmModal } from "@/components/LogoutConfirmModal";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Menu Management", href: "/admin/menu", icon: Utensils },
  { label: "QR Code", href: "/admin/qr", icon: QrCode },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  // No sidebar/shell for the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex">
      {/* Mobile Header */ }
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-white/5 px-4 h-14 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-primary">Admin</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col p-6 pt-24 lg:pt-6">
          <div className="mb-10 px-2 lg:block hidden">
            <h1 className="text-2xl font-bold tracking-tight text-primary underline underline-offset-8 decoration-white/10">Admin</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Management Panel</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                    ${active 
                      ? "bg-secondary text-primary font-bold shadow-lg shadow-primary/10" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"}
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className={`w-5 h-5 ${active ? "text-primary" : ""}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <Link 
              href="/admin/settings"
              className="flex items-center gap-3 px-4 py-2 hover:bg-white/5 rounded-xl transition-colors group"
              onClick={() => setIsSidebarOpen(false)}
            >
              <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/20 flex items-center justify-center group-hover:border-primary/50 transition-all shadow-lg shrink-0">
                <span className="text-primary text-lg font-black">{user?.name?.charAt(0) || "A"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{user?.name || "Admin User"}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
            
            <div className="pt-4 flex flex-col items-center justify-center opacity-20">
              <div className="h-px w-full bg-white/10 mb-4" />
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center">Powered by MenuQR</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-4 pt-14 lg:pt-8 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </main>
      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal 
        isOpen={showLogoutConfirm} 
        onClose={() => setShowLogoutConfirm(false)} 
        onConfirm={logout} 
      />
    </div>
  );
}
