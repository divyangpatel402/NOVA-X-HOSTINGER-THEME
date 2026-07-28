"use client";
import React, { useState, useEffect } from "react";
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Shield, Clock } from "lucide-react";
import { confirmDialog } from "@/components/NovaConfirmModal";

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, scopes: ["*"] })
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setLabel("");
        fetchKeys();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirmDialog("Are you sure you want to revoke and delete this API key? Applications using it will lose access immediately.", "Revoke API Key", "danger")) return;
    try {
      const res = await fetch(`/api/admin/api-keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        setKeys(prev => prev.filter(k => k.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyKey = () => {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">Application API Keys</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Manage access keys for third-party billing and panel integrations</p>
        </div>
      </div>

      {newKey && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/30 rounded-2xl p-6 shadow-2xl animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-[#10b981]" />
            <h4 className="font-black text-[#10b981] uppercase tracking-wider text-sm">New API Key Generated</h4>
          </div>
          <p className="text-white/70 text-xs mb-4">
            Please copy your new API key now. For security reasons, <strong>it will never be shown again</strong>.
          </p>
          <div className="flex">
            <div className="flex-1 bg-black/60 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 font-mono text-sm text-white select-all">
              {newKey}
            </div>
            <button
              onClick={copyKey}
              className="px-6 bg-[#10b981] hover:bg-[#10b981]/80 text-black font-bold uppercase tracking-wider text-xs rounded-r-xl transition-all flex items-center gap-2"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Key"}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-4 text-xs font-bold text-white/50 hover:text-white uppercase tracking-wider underline"
          >
            I have stored my API key safely
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="bg-[#050508] border border-white/10 p-6 rounded-2xl shadow-xl h-fit">
          <h3 className="font-black text-white uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#ff0f0f]" /> Generate New Key
          </h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Description / Label</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. WHMCS Billing Plugin"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#ff0f0f]"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Permissions</label>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-xs text-white/60 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#3b82f6]" /> Full Administrative Access (*)
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !label.trim()}
              className="w-full py-3 bg-[#ff0f0f] hover:bg-[#ff0f0f]/80 disabled:opacity-50 text-white font-bold rounded-xl uppercase tracking-wider text-xs transition-all shadow-[0_0_15px_rgba(255,15,15,0.3)]"
            >
              {creating ? "Generating..." : "Create API Key"}
            </button>
          </form>
        </div>

        {/* Key List */}
        <div className="md:col-span-2 bg-[#050508] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="bg-[#121317] border-b border-white/5 px-6 py-4 flex items-center justify-between">
            <h3 className="font-black text-white uppercase tracking-wider text-sm flex items-center gap-2">
              <Key className="w-4 h-4 text-[#3b82f6]" /> Active Keys ({keys.length})
            </h3>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-white/40 text-sm animate-pulse">Loading API keys...</div>
          ) : keys.length === 0 ? (
            <div className="p-12 text-center text-white/40">
              <Key className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-bold text-white mb-1">No API Keys Generated</p>
              <p className="text-xs">Create an API key to enable external integrations.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {keys.map((key) => (
                <div key={key.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl text-[#3b82f6]">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{key.label}</h4>
                      <div className="flex items-center gap-3 text-[11px] text-white/40 mt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Created: {new Date(key.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white/60">id: {key.id.substring(0, 8)}...</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(key.id)}
                    className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all"
                    title="Revoke Key"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
