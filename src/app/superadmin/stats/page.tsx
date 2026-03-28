"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Store, 
  ShoppingBag, 
  DollarSign, 
  Banknote,
  ArrowUpRight, 
  Loader2, 
  Clock,
  ShieldCheck,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";

export default function PlatformStatsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/superadmin/stats");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        setError("Unable to retrieve platform metrics at this time.");
      }
    } catch (err) {
      console.error("Stats fetch failed:", err);
      setError("Something went wrong while fetching platform data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[70vh] flex items-center justify-center p-6 text-center">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-white mb-2">Systems Warning</h2>
          <p className="text-gray-400 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: "Total Admins", 
      value: data.metrics.totalAdmins, 
      icon: ShieldCheck, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      description: "Cafeteria managers" 
    },
    { 
      label: "Total Cafeterias", 
      value: data.metrics.totalCafeterias, 
      icon: Store, 
      color: "text-primary", 
      bg: "bg-primary/10",
      description: "Live canteens"
    },
    { 
      label: "Total Customers", 
      value: data.metrics.totalCustomers, 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      description: "Registered users"
    },
    { 
      label: "Total Revenue", 
      value: `RS ${data.metrics.totalRevenue.toLocaleString()}`, 
      icon: Banknote, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      description: "Processed payments"
    },
  ];

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-primary/20 px-3 py-1 rounded-full border border-primary/20">
            <span className="text-[10px] text-primary font-black uppercase tracking-widest">Global Overview</span>
          </div>
        </div>
        <h1 className="text-5xl font-black text-white leading-none">Platform <span className="text-primary italic">Stats</span></h1>
        <p className="text-gray-500 font-medium mt-3 text-lg">Real-time performance metrics across the entire CPS network.</p>
      </header>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="bg-[#111111] border-white/5 overflow-hidden group hover:border-white/10 transition-all shadow-2xl">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-gray-800 group-hover:text-primary transition-colors" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</p>
                  <h3 className="text-3xl font-black text-white">{stat.value}</h3>
                  <p className="text-[10px] text-gray-600 font-bold uppercase mt-2">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Cafeterias List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Clock className="w-6 h-6 text-primary" />
              Recent Onboarding
            </h2>
          </div>
          <div className="bg-[#111111] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="divide-y divide-white/5">
              {data.recentCafeterias.length > 0 ? data.recentCafeterias.map((caf: any) => (
                <div key={caf._id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center">
                      <Store className="w-6 h-6 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">{caf.name}</h4>
                      <p className="text-xs text-gray-500 font-mono tracking-wider">{caf.canteenCode}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest mb-1 ${
                      caf.isActive ? "bg-green-500/10 text-green-500 border border-green-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                    }`}>
                      {caf.isActive ? "Active" : "Locked"}
                    </span>
                    <p className="text-[10px] text-gray-600 font-bold uppercase">
                      {new Date(caf.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-gray-700 font-bold italic">
                  No cafeterias registered yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mini Stats / Meta Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            Trends
          </h2>
          <Card className="bg-primary/5 border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest leading-none">Total Activity</p>
                <h3 className="text-4xl font-black text-white">{data.metrics.totalOrders} <span className="text-sm font-medium text-gray-500 uppercase tracking-tighter">Orders</span></h3>
              </div>
              <div className="pt-6 border-t border-primary/10">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="text-sm font-bold text-gray-400">Order Throughput</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[65%]" />
                </div>
                <p className="text-[10px] text-gray-600 font-bold uppercase mt-3">Platform scalability status: optimal</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
