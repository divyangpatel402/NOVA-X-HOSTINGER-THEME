"use client";
import { useState, useEffect } from "react";
import { ShoppingBag, Plus, Edit, Trash2, Check, X, Sparkles, RefreshCw, Layers, Shield, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { confirmDialog, alertDialog } from "@/components/NovaConfirmModal";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [eggs, setEggs] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingProd, setEditingProd] = useState<any | null>(null);
  const [form, setForm] = useState<any>({
    name: "",
    category: "🎮 Game Servers",
    price: 499,
    ram: 4096,
    cpu: 200,
    storage: 30,
    eggId: "",
    nodeId: "all",
    description: "",
    features: "Instant Automated Provisioning, DDoS Shielded Routing, Automated Backups, 24/7 Support"
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, eggRes, nodeRes] = await Promise.all([
        fetch("/api/client/products"),
        fetch("/api/admin/eggs"),
        fetch("/api/admin/nodes")
      ]);
      const prodData = await prodRes.json();
      const eggData = await eggRes.json();
      const nodeData = await nodeRes.json();

      if (prodData.success) {
        setProducts(prodData.products || []);
      }
      if (eggData.success) {
        setEggs(eggData.eggs || []);
        if (!form.eggId && eggData.eggs && eggData.eggs.length > 0) {
          setForm((prev: any) => ({ ...prev, eggId: eggData.eggs[0].id }));
        }
      }
      if (nodeData.success) {
        setNodes(nodeData.nodes || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProd(null);
    setForm({
      name: "",
      category: selectedCategory === "All" ? "🎮 Game Servers" : selectedCategory,
      price: 499,
      ram: 4096,
      cpu: 200,
      storage: 30,
      eggId: eggs.length > 0 ? eggs[0].id : "minecraft_java",
      nodeId: "all",
      allowedEggs: eggs.map(e => e.id),
      description: "",
      features: "Instant Automated Provisioning, DDoS Shielded Routing, Automated Backups, 24/7 Support"
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (prod: any) => {
    setEditingProd(prod);
    setForm({
      name: prod.name || "",
      category: prod.category || "🎮 Game Servers",
      price: prod.price || 499,
      ram: prod.ram || 4096,
      cpu: prod.cpu || 200,
      storage: prod.storage || 30,
      eggId: prod.eggId || "",
      nodeId: prod.nodeId || "all",
      allowedEggs: Array.isArray(prod.allowedEggs) ? prod.allowedEggs : eggs.map(e => e.id),
      description: prod.description || "",
      features: Array.isArray(prod.features) ? prod.features.join(", ") : (prod.features || "")
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.eggId) {
      await alertDialog("Please fill in Product Name and select an Assigned Egg!", "Missing Fields", "warning");
      return;
    }

    const payload = {
      ...form,
      id: editingProd ? editingProd.id : `prod_${Date.now()}`,
      price: Number(form.price),
      ram: Number(form.ram),
      cpu: Number(form.cpu),
      storage: Number(form.storage),
      nodeId: form.nodeId || "all",
      allowedEggs: Array.isArray(form.allowedEggs) ? form.allowedEggs : [],
      features: typeof form.features === 'string' ? form.features.split(",").map((s: string) => s.trim()).filter(Boolean) : form.features
    };

    try {
      const method = editingProd ? "PUT" : "POST";
      const res = await fetch("/api/client/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowModal(false);
        fetchData();
        await alertDialog("Store product saved successfully!", "Success", "success");
      } else {
        await alertDialog("Failed to save store product.", "Save Error", "danger");
      }
    } catch (err) {
      await alertDialog("Error saving store product.", "Network Error", "danger");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!await confirmDialog(`Are you sure you want to delete product "${name}"? This will remove it from the public website & client catalog immediately.`, "Delete Product", "danger")) return;
    try {
      const res = await fetch(`/api/client/products?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id));
        await alertDialog("Product deleted successfully.", "Deleted", "success");
      } else {
        await alertDialog("Failed to delete product.", "Delete Error", "danger");
      }
    } catch (err) {
      await alertDialog("Error deleting product.", "Network Error", "danger");
    }
  };

  const categories = ["All", "🎮 Game Servers", "🤖 Discord Bots", "☁️ Cloud VPS", "🌐 Web Hosting", "🖥️ Dedicated Servers"];

  const filteredProducts = products.filter(p => {
    if (selectedCategory === "All") return true;
    return p.category === selectedCategory || (p.category && p.category.includes(selectedCategory.replace(/[^a-zA-Z ]/g, "").trim()));
  });

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-[#ff0f0f]" />
            Store & Plans Catalog Manager
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Create and price plans for Game Servers, Discord Bots, Cloud VPS, Web Hosting, and Dedicated VDS. All changes reflect live on public website category pages!
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            type="button" 
            onClick={fetchData} 
            className="bg-white/10 hover:bg-white/15 text-white p-2.5 rounded-xl transition-all cursor-pointer border border-white/10"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            type="button" 
            onClick={handleOpenAddModal} 
            className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff0f0f]/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> + Add New Store Plan
          </button>
        </div>
      </div>

      {/* Category Filter Bar */}
      <div className="bg-[#121317] border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <span className="text-xs font-black text-[#ff0f0f] uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Filter by Website Category ({products.length} Total Plans)
          </span>
          <span className="text-[11px] text-white/40">Select a tab to view plans displayed on that page</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map(cat => {
            const count = cat === "All" ? products.length : products.filter(p => p.category === cat || (p.category && p.category.includes(cat.replace(/[^a-zA-Z ]/g, "").trim()))).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                  selectedCategory === cat 
                    ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border-[#ff0f0f]/40 shadow-md shadow-[#ff0f0f]/10' 
                    : 'bg-black/30 text-white/60 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{cat}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                  selectedCategory === cat ? 'bg-[#ff0f0f] text-white' : 'bg-white/10 text-white/50'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="bg-[#121317] border border-white/5 rounded-2xl p-12 text-center text-white/40 animate-pulse">
          Loading store catalog & auto-provisioning mappings...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-[#121317] border border-white/5 rounded-2xl p-12 text-center text-white/40 flex flex-col items-center justify-center gap-3">
          <ShoppingBag className="w-10 h-10 text-white/20" />
          <span className="font-bold text-base text-white/70">No plans found in this category</span>
          <span className="text-xs text-white/40 max-w-md">Click "+ Add New Store Plan" above to create pricing tiers. They will instantly appear on the public website for clients to order!</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(prod => {
            const assignedEgg = eggs.find(e => e.id === prod.eggId);
            return (
              <div 
                key={prod.id} 
                className="bg-[#121317]/90 backdrop-blur-xl border border-white/10 hover:border-[#ff0f0f]/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-[#ff0f0f]/5 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#ff0f0f]/10 to-transparent rounded-bl-full pointer-events-none group-hover:from-[#ff0f0f]/20 transition-all"></div>
                
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="bg-white/5 border border-white/10 text-white/80 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      {prod.category || "General"}
                    </span>
                    <div className="flex items-center gap-1.5 z-10">
                      <button 
                        type="button" 
                        onClick={() => handleOpenEditModal(prod)} 
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition-colors cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteProduct(prod.id, prod.name)} 
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors cursor-pointer"
                        title="Delete Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black text-white group-hover:text-[#ff0f0f] transition-colors mb-2">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-white/50 line-clamp-2 mb-5 min-h-[32px]">
                    {prod.description || "No description provided."}
                  </p>

                  <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/5 rounded-xl p-3 mb-5 text-center">
                    <div>
                      <span className="text-[10px] text-white/40 block font-bold uppercase">RAM</span>
                      <span className="text-xs font-black text-emerald-400">{prod.ram} MB</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block font-bold uppercase">CPU</span>
                      <span className="text-xs font-black text-blue-400">{prod.cpu}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block font-bold uppercase">Disk</span>
                      <span className="text-xs font-black text-purple-400">{prod.storage} GB</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    {Array.isArray(prod.features) && prod.features.map((feat: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                        <Check className="w-3.5 h-3.5 text-[#ff0f0f] flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between mt-auto">
                  <div>
                    <span className="text-[10px] text-white/40 block uppercase font-bold">Assigned Egg</span>
                    <span className="text-xs font-bold text-yellow-400 truncate max-w-[150px] block">
                      {assignedEgg ? assignedEgg.name : (prod.eggId || "None")}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/40 block uppercase font-bold">Monthly Price</span>
                    <span className="text-xl font-black text-white orbitron-font">
                      ₹{prod.price}
                      <span className="text-xs text-white/50 font-normal">/mo</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-[#121317] border border-white/15 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#ff0f0f]" />
                {editingProd ? `Edit Plan: ${editingProd.name}` : "Create New Store Plan"}
              </h3>
              <button type="button" onClick={() => setShowModal(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#ff0f0f] uppercase mb-1.5">Plan Title / Name</label>
                  <input 
                    type="text" 
                    required 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="e.g. Minecraft Extreme Pro (8GB)" 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#ff0f0f]/50" 
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#ff0f0f] uppercase mb-1.5">Website Category</label>
                  <select 
                    value={form.category} 
                    onChange={e => setForm({...form, category: e.target.value})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-[#ff0f0f]/50 cursor-pointer"
                  >
                    <option value="🎮 Game Servers">🎮 Game Servers</option>
                    <option value="🤖 Discord Bots">🤖 Discord Bots</option>
                    <option value="☁️ Cloud VPS">☁️ Cloud VPS</option>
                    <option value="🌐 Web Hosting">🌐 Web Hosting</option>
                    <option value="🖥️ Dedicated Servers">🖥️ Dedicated Servers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/30 p-3.5 rounded-xl border border-white/5">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">RAM (MB)</label>
                  <input 
                    type="number" 
                    required 
                    value={form.ram} 
                    onChange={e => setForm({...form, ram: Number(e.target.value)})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2.5 text-xs text-white font-bold outline-none focus:border-emerald-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-blue-400 uppercase mb-1">CPU (%)</label>
                  <input 
                    type="number" 
                    required 
                    value={form.cpu} 
                    onChange={e => setForm({...form, cpu: Number(e.target.value)})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2.5 text-xs text-white font-bold outline-none focus:border-blue-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-purple-400 uppercase mb-1">Disk (GB)</label>
                  <input 
                    type="number" 
                    required 
                    value={form.storage} 
                    onChange={e => setForm({...form, storage: Number(e.target.value)})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2.5 text-xs text-white font-bold outline-none focus:border-purple-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-yellow-400 uppercase mb-1">Price (₹/mo)</label>
                  <input 
                    type="number" 
                    required 
                    value={form.price} 
                    onChange={e => setForm({...form, price: Number(e.target.value)})} 
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-lg p-2.5 text-xs text-white font-bold outline-none focus:border-yellow-500/50" 
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#ff0f0f] uppercase mb-1.5 flex items-center justify-between">
                  <span>Assigned Auto-Provisioning Server Egg</span>
                  <span className="text-[10px] text-white/40 font-normal">Server will deploy with this runtime engine</span>
                </label>
                <select 
                  value={form.eggId} 
                  onChange={e => setForm({...form, eggId: e.target.value})} 
                  required
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-[#ff0f0f]/50 cursor-pointer"
                >
                  <option value="">-- Select Installed Server Egg --</option>
                  {eggs.map(egg => (
                    <option key={egg.id} value={egg.id}>
                      [{egg.nest || "General"}] {egg.name} ({egg.docker_image})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-emerald-400 uppercase mb-1.5 flex items-center justify-between">
                  <span>Assigned Provisioning Node / Server Pool</span>
                  <span className="text-[10px] text-white/40 font-normal">Which Node supplies IP & Port allocation</span>
                </label>
                <select 
                  value={form.nodeId || "all"} 
                  onChange={e => setForm({...form, nodeId: e.target.value})} 
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option value="all">🌐 Auto-Select / All Available Nodes</option>
                  {nodes.map(node => (
                    <option key={node.id} value={node.id}>
                      🖥️ {node.name} ({node.fqdn}) - {node.memory} MB RAM / {node.disk} GB Disk
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#ff0f0f]" /> Allowed Engine Versions / Nests for Client Switcher
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm((prev: any) => ({ ...prev, allowedEggs: eggs.map(e => e.id) }))}
                      className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white/70"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((prev: any) => ({ ...prev, allowedEggs: [] }))}
                      className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded text-white/70"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-white/40">Check which specific egg versions (e.g. Paper, Forge, Fabric) the customer is allowed to switch between on this plan. Unchecked engines will be hidden.</p>
                
                <div className="max-h-52 overflow-y-auto bg-black/40 border border-white/10 rounded-xl p-3 space-y-3">
                  {Array.from(new Set(eggs.map(e => e.nest || 'General'))).map(nest => {
                    const nestEggs = eggs.filter(e => (e.nest || 'General') === nest);
                    return (
                      <div key={nest} className="space-y-1.5">
                        <span className="text-[10px] font-black text-[#ff0f0f] uppercase tracking-widest bg-[#ff0f0f]/10 px-2 py-0.5 rounded inline-block">
                          {nest} Nest ({nestEggs.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {nestEggs.map(e => {
                            const isChecked = Array.isArray(form.allowedEggs) && form.allowedEggs.includes(e.id);
                            return (
                              <label key={e.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                                isChecked ? 'bg-[#ff0f0f]/15 border-[#ff0f0f]/40 text-white font-semibold' : 'bg-white/5 border-white/5 text-white/60 hover:bg-white/10'
                              }`}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(evt) => {
                                    const checked = evt.target.checked;
                                    setForm((prev: any) => {
                                      const curr = Array.isArray(prev.allowedEggs) ? [...prev.allowedEggs] : [];
                                      return {
                                        ...prev,
                                        allowedEggs: checked ? [...curr, e.id] : curr.filter(id => id !== e.id)
                                      };
                                    });
                                  }}
                                  className="rounded border-white/20 bg-black/50 text-[#ff0f0f] focus:ring-0"
                                />
                                <span className="truncate">{e.name} ({e.id})</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-bold text-white/70 uppercase mb-1.5">Description</label>
                <textarea 
                  rows={2} 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  placeholder="Brief description displayed on product cards..." 
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#ff0f0f]/50" 
                />
              </div>

              <div>
                <label className="block font-bold text-white/70 uppercase mb-1.5 flex items-center justify-between">
                  <span>Features List (comma-separated)</span>
                  <span className="text-[10px] text-white/40 font-normal">Displayed with checkmarks on cards</span>
                </label>
                <textarea 
                  rows={3} 
                  value={form.features} 
                  onChange={e => setForm({...form, features: e.target.value})} 
                  placeholder="Instant Automated Provisioning, DDoS Shielded Routing, Automated Backups, 24/7 Support" 
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#ff0f0f]/50" 
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3 bg-white/[0.01]">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md">
                  {editingProd ? "Save Changes" : "Create Plan Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
