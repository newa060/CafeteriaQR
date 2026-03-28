"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, 
  BarChart3, 
  Settings, 
  LogOut, 
  ShieldCheck,
  Menu as MenuIcon, 
  X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { label: "Admin Management", href: "/superadmin", icon: Users },
  { label: "Platform Stats", href: "/superadmin/stats", icon: BarChart3 },
];

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // No sidebar/shell for the login page
  if (pathname === "/superadmin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/5 p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">CPS <span className="text-primary font-medium">Superadmin</span></h1>
        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#111111] border-r border-white/5 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="mb-10 px-2 lg:block hidden">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold tracking-tight">CPS <span className="text-white">Super</span></h1>
            </div>
            <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">Root Access Panel</p>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all
                    ${active 
                      ? "bg-primary text-white font-bold shadow-xl shadow-primary/20" 
                      : "text-gray-500 hover:text-white hover:bg-white/5"}
                  `}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-primary font-black">SA</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Super User</p>
                <p className="text-[10px] text-gray-600 truncate uppercase font-bold">{user?.email}</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-400 hover:bg-red-500/10 h-12 rounded-xl"
              onClick={logout}
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
      <main className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 p-6 lg:p-10 pt-24 lg:pt-10 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
