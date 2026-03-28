"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Loader2, 
  Image as ImageIcon,
  Check,
  X,
  AlertCircle,
  PackageSearch
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { CldUploadWidget } from "next-cloudinary";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  isAvailable: boolean;
}

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
    isAvailable: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/admin/menu");
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (err) {
      console.error("Failed to fetch menu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || "",
        price: item.price.toString(),
        category: item.category,
        imageUrl: item.imageUrl || "",
        isAvailable: item.isAvailable
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: "",
        description: "",
        price: "",
        category: "",
        imageUrl: "",
        isAvailable: true
      });
    }
    setIsModalOpen(true);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const method = editingItem ? "PUT" : "POST";
    const body = editingItem 
      ? { ...formData, id: editingItem._id, price: parseFloat(formData.price) } 
      : { ...formData, price: parseFloat(formData.price) };

    try {
      const res = await fetch("/api/admin/menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchMenu();
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("Failed to save menu item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchMenu();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white leading-none">Menu Management</h1>
          <p className="text-gray-500 font-medium">Add, edit, or remove items from your cafeteria's menu.</p>
        </div>
        <Button 
          className="h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 flex items-center gap-3"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search items or categories..." 
          className="bg-transparent border-none outline-none text-white w-full text-lg placeholder:text-gray-600 font-medium"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
          </div>
        ) : filteredItems.length > 0 ? filteredItems.map((item) => (
          <motion.div 
            key={item._id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-[#111111] border-white/5 overflow-hidden group hover:border-primary/20 transition-all shadow-2xl">
              <div className="h-44 relative bg-white/5">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-10">
                    <PackageSearch className="w-16 h-16" />
                  </div>
                )}
                <Badge className="absolute top-4 right-4 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1">
                  {item.category}
                </Badge>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-black text-white leading-tight">{item.name}</h3>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  </div>
                  <span className="text-2xl font-black text-primary">RS {item.price}</span>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.isAvailable ? "bg-green-500" : "bg-red-500"}`} />
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(item)} className="hover:bg-primary/10 hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item._id)} className="hover:bg-red-500/10 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-700">
            <PackageSearch className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-xl font-bold italic opacity-30">No items found matching your search.</p>
          </div>
        )}
      </div>

      {/* Glassy Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-lg"
              onClick={() => setIsModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-3xl font-black text-white">{editingItem ? "Edit Item" : "Add Item"}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                    <X className="w-6 h-6" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Item Name</label>
                      <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Classic Burger" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Price (RS)</label>
                      <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Category</label>
                    <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="e.g. Burgers, Drinks, Desserts" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Description</label>
                    <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Brief description..." />
                  </div>

                  <div className="flex items-center gap-4 py-2">
                    {/* Cloudinary Upload for Item Image */}
                    <CldUploadWidget 
                      uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
                      onSuccess={(result: any) => setFormData({...formData, imageUrl: result.info.secure_url})}
                      options={{
                        sources: ["local"],
                        multiple: false,
                        cropping: false,
                        clientAllowedFormats: ["jpg", "png", "jpeg"],
                        maxFileSize: 5000000,
                        showAdvancedOptions: false,
                        styles: {
                          palette: {
                            window: "#000000",
                            windowBorder: "#222222",
                            tabIcon: "#FF6600",
                            menuIcons: "#FFFFFF",
                            textDark: "#000000",
                            textLight: "#FFFFFF",
                            link: "#FF6600",
                            action: "#FF6600",
                            inactiveTabIcon: "#888888",
                            error: "#FF0000",
                            inProgress: "#FF6600",
                            complete: "#20B832",
                            sourceBg: "#111111"
                          }
                        }
                      }}
                    >
                      {({ open }) => (
                        <button 
                          type="button" 
                          onClick={() => open()}
                          className={`flex-1 flex items-center justify-center gap-2 h-14 rounded-2xl border-2 border-dashed transition-all ${
                            formData.imageUrl 
                              ? "bg-green-500/10 border-green-500/30 text-green-500" 
                              : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          {formData.imageUrl ? <Check className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                          <span className="text-sm font-black">{formData.imageUrl ? "Image Ready" : "Upload Food Image"}</span>
                        </button>
                      )}
                    </CldUploadWidget>

                    <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 h-14 rounded-2xl">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Available</span>
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-primary"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({...formData, isAvailable: e.target.checked})}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <Button className="w-full h-14 text-xl font-black rounded-2xl shadow-xl shadow-primary/20" disabled={submitting}>
                  {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : editingItem ? "Update Item" : "Create Item"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
