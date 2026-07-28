"use client";
import { useState, useEffect } from "react";
import { Save, RefreshCw, Check, AlertCircle, Shield, Image as ImageIcon, Sparkles, Layout, Plus, Edit, Trash2, X, ShoppingBag } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    panelName: "Nova Hosting Panel",
    companyName: "Nova Hosting",
    panelLogo: "",
    panelBackgroundImage: "",
    panelBackgroundBlur: true,
    enableLoginAnimation: true,
    require2FA: "Not Required",
    productEggs: {
      games: "minecraft_java",
      discord: "discord_bot_node",
      webhosting: "web_hosting_nginx",
      vps: "minecraft_java"
    }
  });
  const [eggs, setEggs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchEggs();
  }, []);

  const fetchEggs = async () => {
    try {
      const res = await fetch("/api/admin/eggs");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.eggs) setEggs(data.eggs);
      }
    } catch (e) {
      console.error("Failed to load eggs", e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings((prev: any) => ({ ...prev, ...data.settings }));
        }
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-white/50 animate-pulse text-center p-10">Loading panel settings...</div>;
  }

  return (
    <div className="space-y-6 relative z-10 max-w-4xl animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Layout className="w-6 h-6 text-[#ff0f0f]" />
            Panel & System Settings
          </h2>
          <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1">Configure global branding, security, and UI preferences</p>
        </div>
      </div>
      
      <form onSubmit={handleSave} className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl">
        
        {/* Branding Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-[#ff0f0f] uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
            <ImageIcon className="w-4 h-4" /> Global Branding & Aesthetics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Panel Name</label>
              <input 
                type="text" 
                value={settings.panelName} 
                onChange={e => setSettings({ ...settings, panelName: e.target.value })}
                className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Company Name</label>
              <input 
                type="text" 
                value={settings.companyName} 
                onChange={e => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Logo URL (Optional)</label>
            <input 
              type="text" 
              placeholder="https://example.com/logo.png"
              value={settings.panelLogo} 
              onChange={e => setSettings({ ...settings, panelLogo: e.target.value })}
              className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors"
            />
          </div>
        </div>

        {/* Background & Aesthetics Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-xs font-black text-[#ff0f0f] uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
            <Sparkles className="w-4 h-4" /> Background & Glassmorphism
          </h3>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Global Background Image URL (Optional)</label>
            <input 
              type="text" 
              placeholder="https://example.com/dark-bg.jpg"
              value={settings.panelBackgroundImage} 
              onChange={e => setSettings({ ...settings, panelBackgroundImage: e.target.value })}
              className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.panelBackgroundBlur} 
                onChange={e => setSettings({ ...settings, panelBackgroundBlur: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#ff0f0f] focus:ring-0"
              />
              <span className="text-xs font-bold text-white/80 uppercase">Enable Glassmorphic Blur Effect</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.enableLoginAnimation} 
                onChange={e => setSettings({ ...settings, enableLoginAnimation: e.target.checked })}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-[#ff0f0f] focus:ring-0"
              />
              <span className="text-xs font-bold text-white/80 uppercase">Enable Dynamic Login Animations</span>
            </label>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <h3 className="text-xs font-black text-[#ff0f0f] uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
            <Shield className="w-4 h-4" /> Security & Access
          </h3>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Require 2-Factor Authentication</label>
            <select 
              value={settings.require2FA}
              onChange={e => setSettings({ ...settings, require2FA: e.target.value })}
              className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50"
            >
              <option value="Not Required">Not Required (Default)</option>
              <option value="Admin Only">Admin Only</option>
              <option value="All Users">All Users</option>
            </select>
          </div>
        </div>

        {/* Store Catalog & Product-to-Egg Mapping Section Notice */}
        <div className="pt-6 border-t border-white/10">
          <div className="bg-[#ff0f0f]/10 border border-[#ff0f0f]/30 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2 mb-1">
                <ShoppingBag className="w-5 h-5 text-[#ff0f0f]" /> Store Products & Plans Catalog
              </h3>
              <p className="text-xs text-white/60 max-w-xl">
                Store product management has been moved out of Settings! You can now create, edit, and price game servers, Discord bots, VPS, and hosting plans in the dedicated first-class Store Catalog menu. All changes reflect live across all public website category pages!
              </p>
            </div>
            <a 
              href="/admin/products" 
              className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff0f0f]/20 flex-shrink-0 cursor-pointer"
            >
              Open Store Catalog &rarr;
            </a>
          </div>
        </div>
        
        <div className="pt-6 border-t border-white/10 flex items-center justify-end gap-4">
          {saved && (
            <span className="text-emerald-400 text-xs font-bold uppercase flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" /> Settings Saved Successfully
            </span>
          )}
          <button 
            type="submit"
            disabled={saving}
            className="bg-[#ff0f0f] hover:bg-[#ff0f0f]/80 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(255,15,15,0.4)] flex items-center gap-2 cursor-pointer"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Panel Settings
          </button>
        </div>
      </form>
    </div>
  );
}
