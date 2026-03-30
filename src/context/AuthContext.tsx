"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "customer";
  cafeteriaId?: string;
  faculty?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User, redirectTo?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    try {
      // Determine the panel context from the URL
      let panel = "customer";
      if (pathname?.startsWith("/superadmin")) panel = "superadmin";
      else if (pathname?.startsWith("/admin")) panel = "admin";

      const res = await fetch("/api/auth/me", {
        headers: {
          "x-panel-context": panel
        }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (newUser: User, redirectTo?: string) => {
    setUser(newUser);
    if (redirectTo) {
      router.replace(redirectTo);
      return;
    }
    if (newUser.role === "superadmin") {
      router.replace("/superadmin");
    } else if (newUser.role === "admin") {
      router.replace("/admin");
    } else {
      router.replace("/customer");
    }
  };

  const logout = async () => {
    try {
      const currentRole = user?.role;
      await fetch("/api/auth/logout", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: currentRole })
      });
      setUser(null);
      if (currentRole === "superadmin") router.push("/superadmin/login");
      else if (currentRole === "admin") router.push("/admin/login");
      else router.push("/customer/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
