"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UserPlus, 
  Search, 
  Trash2, 
  Loader2, 
  Check, 
  X, 
  AlertCircle,
  Users,
  Building2,
  TrendingUp,
  Mail,
  MoreVertical,
  ShieldCheck,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  cafeteriaId?: {
    _id: string;
    name: string;
    canteenCode: string;
    isActive: boolean;
  };
  createdAt: string;
}

export default function SuperadminDashboard() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  
  // Form state for creating/editing admin
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    canteenName: "",
    canteenCode: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/superadmin/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data);
      }
    } catch (err) {
      console.error("Failed to fetch admins:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleOpenModal = (admin?: AdminUser) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        name: admin.name,
        email: admin.email,
        canteenName: admin.cafeteriaId?.name || "",
        canteenCode: admin.cafeteriaId?.canteenCode || ""
      });
    } else {
      setEditingAdmin(null);
      setFormData({ name: "", email: "", canteenName: "", canteenCode: "" });
    }
    setIsModalOpen(true);
    setError("");
  };

  const handleDelete = async (admin: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${admin.name} and their cafeteria? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/superadmin/admins?id=${admin._id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        fetchAdmins();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete admin");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("An error occurred while deleting");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const method = editingAdmin ? "PUT" : "POST";
    const payload = editingAdmin 
      ? { ...formData, id: editingAdmin._id } 
      : formData;

    try {
      const res = await fetch("/api/superadmin/admins", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditingAdmin(null);
        setFormData({ name: "", email: "", canteenName: "", canteenCode: "" });
        fetchAdmins();
      } else {
        const data = await res.json();
        setError(data.error || `Failed to ${editingAdmin ? "update" : "create"} admin`);
      }
    } catch (err) {
      setError("An error occurred during submission");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.cafeteriaId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.cafeteriaId?.canteenCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-20">
      {/* Platform Overview */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-white leading-tight">Admin Management</h1>
          <p className="text-gray-500 font-medium">Oversee all cafeteria operations and management accounts.</p>
        </div>
        <Button 
          className="h-14 px-8 rounded-2xl text-lg font-bold shadow-2xl shadow-primary/30 flex items-center gap-3"
          onClick={() => handleOpenModal()}
        >
          <UserPlus className="w-5 h-5" />
          Create New Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="bg-primary/10 border-primary/20 p-8 flex items-center gap-6 shadow-2xl">
          <div className="bg-primary/20 p-4 rounded-3xl shrink-0">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <div>
            <p className="text-4xl font-black text-primary">{admins.length}</p>
            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mt-1">Total Admins</p>
          </div>
        </Card>
        
        <Card className="bg-white/5 border-white/5 p-8 flex items-center gap-6 shadow-2xl">
          <div className="bg-white/5 p-4 rounded-3xl shrink-0">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-4xl font-black text-white">{admins.filter(a => a.cafeteriaId).length}</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Active Canteens</p>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/5 p-8 flex items-center gap-6 shadow-2xl">
          <div className="bg-white/5 p-4 rounded-3xl shrink-0">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-4xl font-black text-white">Live</p>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Status Overview</p>
          </div>
        </Card>
      </div>

      {/* Admin Table Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          <Search className="w-5 h-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Filter by admin name, email, canteen name, or code..." 
            className="bg-transparent border-none outline-none text-white w-full text-lg placeholder:text-gray-600 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 overflow-visible">
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
          ) : filteredAdmins.length > 0 ? filteredAdmins.map((admin) => (
            <motion.div 
              key={admin._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ zIndex: activeMenuId === admin._id ? 100 : 1 }}
              className="relative"
            >
              <Card className="bg-[#111111] border-white/5 hover:border-primary/20 transition-all p-4 px-6 md:p-6 shadow-2xl overflow-visible relative group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-[300px]">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 shrink-0 group-hover:bg-primary/10 transition-colors">
                      <ShieldCheck className="w-7 h-7 text-gray-600 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white tracking-tight">{admin.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                        <Mail className="w-3.5 h-3.5" />
                        {admin.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 md:gap-10">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Assigned Cafeteria</p>
                      <h4 className="font-bold text-white text-md tracking-tight">{admin.cafeteriaId?.name || "N/A"}</h4>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Canteen Code</p>
                      <Badge variant="outline" className="font-mono text-xs py-1 px-3 border-white/10 text-primary">
                        {admin.cafeteriaId?.canteenCode || "N/A"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Status</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${admin.cafeteriaId?.isActive ? "bg-green-500" : "bg-red-500"}`} />
                        <span className="text-xs font-bold text-white">{admin.cafeteriaId?.isActive ? "Live" : "Inactive"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`h-12 w-12 rounded-xl border border-white/5 transition-all ${activeMenuId === admin._id ? "bg-primary text-white border-primary/20" : "hover:bg-white/5 text-gray-500"}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuId(activeMenuId === admin._id ? null : admin._id);
                      }}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </Button>

                    <AnimatePresence>
                      {activeMenuId === admin._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 top-14 w-48 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          <button 
                            onClick={() => handleOpenModal(admin)}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4 text-primary" />
                            Edit Cafeteria
                          </button>
                          <button 
                            onClick={() => handleDelete(admin)}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t border-white/5"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Admin
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </Card>
            </motion.div>
          )) : (
            <div className="py-20 flex flex-col items-center justify-center text-gray-700">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-xl font-bold italic opacity-30">No admin accounts found matching your query.</p>
            </div>
          )}
        </div>
      </div>

      {/* Glassy Modal for New Admin */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-xl bg-[#0d0d0d] border border-white/10 rounded-[32px] shadow-[0_35px_100px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-10 space-y-8">
                <div className="flex justify-between items-center mb-2">
                  <div className="space-y-1">
                    <h2 className="text-4xl font-black text-white tracking-tighter">{editingAdmin ? "Edit Admin" : "New Admin"}</h2>
                    <p className="text-gray-500 text-sm font-medium">
                      {editingAdmin ? "Modify credentials or assigned cafeteria details." : "Create a cafeteria and assign an administrator."}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="h-12 w-12 rounded-2xl bg-white/5">
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-1">Admin Full Name</label>
                    <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" required />
                    </div>
                    <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-1">Admin Email</label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="e.g. admin@cafeteria.com" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-1">Cafeteria/Canteen Name</label>
                    <Input value={formData.canteenName} onChange={(e) => setFormData({...formData, canteenName: e.target.value})} placeholder="e.g. Main Block Canteen" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-1">Unique Canteen Code</label>
                    <Input value={formData.canteenCode} onChange={(e) => setFormData({...formData, canteenCode: e.target.value.toUpperCase()})} placeholder="e.g. MBC-001" maxLength={10} required />
                    <p className="text-[10px] text-gray-600 mt-2 pl-1 italic">This code will be part of the QR URL. Used for short identification.</p>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 text-red-500 text-sm bg-red-500/10 p-5 rounded-2xl border border-red-500/20">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <Button className="w-full h-16 text-xl font-black rounded-3xl shadow-2xl shadow-primary/40 flex items-center justify-center gap-3" disabled={submitting}>
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <> <ShieldCheck className="w-6 h-6" /> {editingAdmin ? "Update Admin Account" : "Create Admin Account"} </>}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
