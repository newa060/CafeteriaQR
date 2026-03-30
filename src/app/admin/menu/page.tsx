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
import { useRef } from "react";

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

  // Custom uploader states
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const body = new FormData();
    body.append("file", file);
    body.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "CafeteriaQR");

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "da5jaib7d"}/image/upload`, {
        method: "POST",
        body,
      });
      const data = await res.json();
      if (data.secure_url) {
        setFormData(prev => ({ ...prev, imageUrl: data.secure_url }));
      } else {
        setError("Failed to upload image.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Error uploading the image.");
    } finally {
      setUploadingImage(false);
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

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

  const handleToggleAvailability = async (item: MenuItem) => {
    // Optimistic UI update for immediate feedback
    setItems(items.map(i => i._id === item._id ? { ...i, isAvailable: !i.isAvailable } : i));
    
    try {
      const res = await fetch("/api/admin/menu", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, id: item._id, isAvailable: !item.isAvailable }),
      });
      if (!res.ok) {
        fetchMenu(); // Revert on failure
      }
    } catch (err) {
      console.error("Toggle failed:", err);
      fetchMenu(); // Revert on failure
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueCategories = Array.from(new Set(items.map(item => item.category))).filter(Boolean);

  return (
    <div className="space-y-8 max-w-7xl lg:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight">Menu Management</h1>
          <p className="text-[11px] sm:text-base text-gray-500 font-medium mt-1">Add, edit, or remove items from your menu.</p>
        </div>
        <Button 
          className="w-full sm:w-auto h-12 sm:h-14 px-8 rounded-2xl text-base sm:text-lg font-bold shadow-xl shadow-primary/20 flex justify-center items-center gap-3"
          onClick={() => handleOpenModal()}
        >
          <Plus className="w-5 h-5" />
          Add New Item
        </Button>
      </div>

      <div className="flex items-center gap-3 bg-white/5 p-3.5 rounded-2xl border border-white/5">
        <Search className="w-5 h-5 text-gray-500" />
        <input 
          type="text" 
          placeholder="Search items or categories..." 
          className="bg-transparent border-none outline-none text-white w-full text-base sm:text-lg placeholder:text-gray-600 font-medium"
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
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[17px] sm:text-xl font-black text-white leading-snug truncate">{item.name}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                  <span className="text-lg sm:text-2xl font-black text-primary shrink-0">RS {item.price}</span>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <button 
                    onClick={() => handleToggleAvailability(item)}
                    title={item.isAvailable ? "Click to mark as disabled/sold out" : "Click to mark as available"}
                    className="flex items-center gap-3 p-1 rounded-xl hover:bg-white/5 transition-all group/toggle"
                  >
                    {/* Modern Toggle Switch UI */}
                    <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out ${item.isAvailable ? 'bg-green-500 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : 'bg-white/10 border-white/5'}`}>
                      <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-300 ease-in-out flex items-center justify-center ${item.isAvailable ? 'translate-x-5' : 'translate-x-0'}`}>
                      </span>
                    </div>
                    {/* Text Label */}
                    <div className="flex flex-col items-start leading-none opacity-80 group-hover/toggle:opacity-100 transition-opacity">
                      <span className={`text-[11px] font-black uppercase tracking-widest ${item.isAvailable ? "text-green-500" : "text-gray-500"}`}>
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </span>
                      <span className="text-[9px] font-bold text-gray-600 uppercase tracking-wider mt-0.5">Click to toggle</span>
                    </div>
                  </button>
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
              className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
                <div className="flex justify-between items-center mb-1">
                  <h2 className="text-xl sm:text-2xl font-black text-white">{editingItem ? "Edit Item" : "Add Item"}</h2>
                  <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="w-8 h-8 p-0">
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Item Name</label>
                      <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. Classic Burger" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Price (RS)</label>
                      <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} placeholder="0.00" required />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Category</label>
                      {uniqueCategories.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
                          {uniqueCategories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setFormData({...formData, category: cat})}
                              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                formData.category === cat 
                                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" 
                                  : "bg-white/5 border-white/10 text-gray-500 hover:text-white hover:border-white/20"
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} placeholder="e.g. Burgers, Drinks, Desserts" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Description</label>
                    <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Brief description..." />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">Image URL (Optional)</label>
                    <Input value={formData.imageUrl} onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://example.com/image.png" className="h-10 text-sm" />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-1">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg" 
                      className="hidden" 
                      ref={imageInputRef} 
                      onChange={handleImageUpload} 
                    />
                    <button 
                      type="button" 
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed transition-all ${
                        formData.imageUrl 
                          ? "bg-green-500/10 border-green-500/30 text-green-500" 
                          : "bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : formData.imageUrl ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      <span className="text-xs font-bold">
                        {uploadingImage ? "Uploading..." : formData.imageUrl ? "Image Ready" : "Upload Image"}
                      </span>
                    </button>

                    <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/5 border border-white/5 px-3 h-11 rounded-xl w-full sm:w-auto">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Available</span>
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-primary"
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

                <Button className="w-full h-12 text-sm font-bold rounded-xl shadow-xl shadow-primary/20" disabled={submitting}>
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : editingItem ? "Update Item" : "Create Item"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
