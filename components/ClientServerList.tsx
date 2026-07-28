"use client";
import { useState } from "react";
import { Server, Play, RotateCw, Square, Terminal, Copy, Check, Shield, Cpu, HardDrive, Zap, Globe, Search, Filter, CheckSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { alertDialog } from "@/components/NovaConfirmModal";

interface ClientServerListProps {
  servers: any[];
  loading: boolean;
  onRefresh: () => void;
}

export default function ClientServerList({ servers, loading, onRefresh }: ClientServerListProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const categories = ["All", "Minecraft", "Discord Bot", "VPS / Cloud", "Databases", "General"];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePowerAction = async (serverId: string, action: 'start' | 'restart' | 'stop', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setActionLoading(prev => ({ ...prev, [serverId]: action }));
    try {
      const res = await fetch(`/api/client/servers/${serverId}/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        onRefresh();
      } else {
        await alertDialog(`Failed to execute power action ${action}`, "Power Action Failed", "danger");
      }
    } catch (err) {
      await alertDialog("Error communicating with server node.", "Node Error", "danger");
    } finally {
      setActionLoading(prev => {
        const next = { ...prev };
        delete next[serverId];
        return next;
      });
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === filteredServers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServers.map(s => s.id));
    }
  };

  const handleToggleOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const filteredServers = servers.filter(s => {
    const nameMatch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (s.allocation && s.allocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const nestName = s.nest || (s.name.toLowerCase().includes('minecraft') ? 'Minecraft' : s.name.toLowerCase().includes('bot') ? 'Discord Bot' : 'General');
    const catMatch = selectedCategory === "All" || nestName.toLowerCase().includes(selectedCategory.toLowerCase()) || 
                     (selectedCategory === "VPS / Cloud" && (nestName.includes("General") || nestName.includes("VPS"))) ||
                     (selectedCategory === "Databases" && nestName.includes("Database"));
    return nameMatch && catMatch;
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header & Filter Controls */}
      <div className="bg-[#121317]/95 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ff0f0f]/15 border border-[#ff0f0f]/30 flex items-center justify-center text-[#ff0f0f]">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
              My Deployed Servers
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">{servers.length}</span>
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Manage power states, console terminals, engine switchers, and resource telemetry.</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3.5 top-3" />
          <input 
            type="text" 
            placeholder="Search by name, IP, or ID..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#ff0f0f]/50 transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs & Mass Select Action */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-[#ff0f0f] text-white shadow-[0_0_15px_rgba(255,15,15,0.3)]' 
                  : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredServers.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAll}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/70 transition-colors cursor-pointer"
            >
              <input 
                type="checkbox" 
                checked={selectedIds.length > 0 && selectedIds.length === filteredServers.length} 
                onChange={() => {}} 
                className="rounded bg-black/40 border-white/20 text-[#ff0f0f] focus:ring-0 cursor-pointer pointer-events-none"
              />
              <span>{selectedIds.length === filteredServers.length ? "Deselect All" : "Select All"}</span>
            </button>

            {selectedIds.length > 0 && (
              <span className="text-xs font-bold text-[#ff0f0f] bg-[#ff0f0f]/10 border border-[#ff0f0f]/30 px-3 py-1.5 rounded-lg animate-pulse">
                {selectedIds.length} Server(s) Selected
              </span>
            )}
          </div>
        )}
      </div>

      {/* Servers List */}
      {loading ? (
        <div className="bg-[#121317]/80 border border-white/5 rounded-3xl p-12 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#ff0f0f] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-white/50 font-medium">Loading live server status and node telemetry...</p>
        </div>
      ) : filteredServers.length === 0 ? (
        <div className="bg-[#121317]/80 border border-white/5 rounded-3xl p-12 text-center space-y-4">
          <Server className="w-12 h-12 text-white/20 mx-auto" />
          <div>
            <h4 className="text-base font-bold text-white">No Servers Found</h4>
            <p className="text-xs text-white/50 mt-1">You don't have any deployed servers matching this category or filter.</p>
          </div>
          <Link href="/client?tab=catalog" className="inline-flex items-center gap-2 bg-[#ff0f0f] hover:bg-[#ff2222] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[#ff0f0f]/20">
            <Sparkles className="w-3.5 h-3.5" /> Deploy New Server
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredServers.map((s) => {
            const isSelected = selectedIds.includes(s.id);
            const isOnline = s.status === 'online';
            const nestName = s.nest || (s.name.toLowerCase().includes('minecraft') ? 'Minecraft' : 'General');
            const ramMax = s.limits?.memory || 4096;
            const ramUsed = isOnline ? Math.floor(ramMax * 0.45) : 0;
            const cpuUsed = isOnline ? Math.floor(Math.random() * 25) + 5 : 0;
            const diskUsed = Math.floor((s.limits?.disk || 20000) * 0.15);

            return (
              <div 
                key={s.id} 
                onClick={(e) => handleToggleOne(s.id, e)}
                className={`group border rounded-2xl p-6 transition-all duration-300 relative overflow-hidden bg-gradient-to-r ${
                  isSelected 
                    ? 'from-[#ff0f0f]/15 via-[#1a1c24] to-[#121317] border-[#ff0f0f]/60 shadow-[0_0_25px_rgba(255,15,15,0.15)]' 
                    : 'from-[#161821] via-[#121317] to-[#0d0e12] border-white/10 hover:border-white/25 hover:shadow-xl'
                } cursor-pointer`}
              >
                {/* Left Accent Bar */}
                <div className={`absolute top-0 left-0 w-1.5 h-full transition-all ${
                  nestName.includes('Minecraft') ? 'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]' :
                  nestName.includes('Bot') ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]' :
                  'bg-[#ff0f0f] shadow-[0_0_15px_rgba(255,15,15,0.8)]'
                }`} />

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pl-3">
                  
                  {/* Left: Checkbox & Title & Node */}
                  <div className="flex items-start gap-4">
                    <div className="pt-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded bg-black/60 border-white/30 text-[#ff0f0f] focus:ring-0 cursor-pointer w-4 h-4"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <Link 
                          href={`/client/servers/${s.id}`} 
                          onClick={e => e.stopPropagation()} 
                          className="text-lg font-black text-white hover:text-[#ff0f0f] transition-colors flex items-center gap-2"
                        >
                          <span>{s.name}</span>
                        </Link>
                        
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isOnline 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`}></span>
                          {isOnline ? 'Online' : 'Offline'}
                        </span>

                        <span className="bg-white/5 border border-white/10 text-white/50 text-[10px] font-mono px-2 py-0.5 rounded">
                          #{s.id.slice(0, 8)}
                        </span>
                      </div>

                      {/* Connection IP & Copy */}
                      <div className="flex items-center gap-2 text-xs font-mono text-white/60">
                        <Globe className="w-3.5 h-3.5 text-[#ff0f0f]" />
                        <span className="text-white/80 font-bold">{s.allocation || "node-default.novahosting.com:25565"}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(s.id, s.allocation || "node-default.novahosting.com:25565");
                          }}
                          className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                          title="Copy IP Address"
                        >
                          {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Resource Mini Bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-black/40 border border-white/5 rounded-xl p-3 lg:w-[380px] w-full mt-4 lg:mt-0">
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase mb-1">
                        <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-blue-400" /> RAM</span>
                        <span className="font-mono text-white">{ramUsed} / {ramMax}M</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full" style={{ width: `${Math.min(100, (ramUsed / ramMax) * 100)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase mb-1">
                        <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> CPU</span>
                        <span className="font-mono text-white">{cpuUsed}%</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full" style={{ width: `${Math.min(100, cpuUsed)}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase mb-1">
                        <span className="flex items-center gap-1"><HardDrive className="w-3 h-3 text-purple-400" /> DISK</span>
                        <span className="font-mono text-white">{Math.floor(diskUsed/1024)}G</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-400 h-full rounded-full" style={{ width: `30%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                    <Link
                      href={`/client/servers/${s.id}`}
                      className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-lg hover:shadow-[#ff0f0f]/30"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                      <span>Console</span>
                    </Link>

                    <button
                      onClick={(e) => handlePowerAction(s.id, 'restart', e)}
                      disabled={!!actionLoading[s.id]}
                      className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/80 hover:text-white p-2.5 rounded-xl transition-all disabled:opacity-50"
                      title="Restart Server"
                    >
                      <RotateCw className={`w-4 h-4 ${actionLoading[s.id] === 'restart' ? 'animate-spin text-amber-400' : ''}`} />
                    </button>

                    <button
                      onClick={(e) => handlePowerAction(s.id, 'stop', e)}
                      disabled={!!actionLoading[s.id]}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 p-2.5 rounded-xl transition-all disabled:opacity-50"
                      title="Stop Server"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
