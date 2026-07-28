"use client";
import { useState, useEffect } from "react";
import { Sparkles, Check, AlertTriangle, Lock, RefreshCw, Cpu, Server, ShieldAlert } from "lucide-react";

interface ClientEggSwitcherProps {
  server: any;
  onUpdate: () => void;
}

export default function ClientEggSwitcher({ server, onUpdate }: ClientEggSwitcherProps) {
  const [eggs, setEggs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchEggs();
  }, []);

  const fetchEggs = async () => {
    try {
      const res = await fetch("/api/admin/eggs");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.eggs) {
          setEggs(data.eggs);
        }
      }
    } catch (e) {
      console.error("Failed to load eggs", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitch = async (eggId: string) => {
    setSwitchingId(eggId);
    setError(null);
    setSuccessMsg(null);

    const savedUser = localStorage.getItem("nova_client_user");
    let email = "";
    let username = "";
    if (savedUser) {
      try {
        const p = JSON.parse(savedUser);
        email = p.email;
        username = p.username;
      } catch (e) {}
    }

    try {
      const res = await fetch(`/api/client/servers/${server.id}/egg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eggId, email, username })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to switch engine.");
      } else {
        setSuccessMsg(data.message || "Successfully switched server engine!");
        onUpdate();
      }
    } catch (err) {
      setError("Network error while switching engine.");
    } finally {
      setSwitchingId(null);
    }
  };

  const currentRam = server?.limits?.memory || 0;

  if (loading) {
    return (
      <div className="bg-[#121317]/95 border border-[#ff0f0f]/15 p-8 rounded-2xl shadow-xl text-center">
        <RefreshCw className="w-6 h-6 animate-spin text-[#ff0f0f] mx-auto mb-3" />
        <p className="text-white/50 text-sm animate-pulse font-mono">Loading available game & bot engines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1e1525] via-[#121317] to-[#121317] border border-purple-500/30 p-6 rounded-2xl shadow-xl flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Engine & Template Switcher
          </h2>
          <p className="text-white/50 text-xs mt-1">
            Change your server&apos;s underlying game or bot software at any time. Reinstalls startup scripts automatically.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="bg-black/50 border border-emerald-500/30 px-4 py-2 rounded-xl flex items-center gap-3">
            <Server className="w-4 h-4 text-emerald-400" />
            <div className="text-left">
              <p className="text-[10px] text-white/40 uppercase font-bold">Active Nest &amp; Engine</p>
              <p className="text-xs font-black text-emerald-300 font-mono">{server?.nest || 'General'} &rarr; {server?.eggId || 'Default'}</p>
            </div>
          </div>
          <div className="bg-black/50 border border-purple-500/20 px-4 py-2 rounded-xl flex items-center gap-3">
            <Cpu className="w-4 h-4 text-purple-400" />
            <div className="text-left">
              <p className="text-[10px] text-white/40 uppercase font-bold">Allocated Memory</p>
              <p className="text-sm font-black text-white font-mono">{currentRam} MB RAM</p>
            </div>
          </div>
        </div>
      </div>

      {/* RAM Warning Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="font-bold uppercase text-amber-300 block mb-0.5">⚠️ Memory Requirement Notice:</strong>
          Minecraft Java servers require a minimum of <strong>2048 MB (2 GB) RAM</strong> to run stably without out-of-memory crashes. For servers with less than 2 GB RAM (such as 512 MB or 1 GB bot plans), Minecraft engines are locked to protect host stability.
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/15 border border-red-500/40 p-4 rounded-xl flex items-center gap-3 text-red-300 text-xs font-bold uppercase tracking-wide animate-in shake">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 p-4 rounded-xl flex items-center gap-3 text-emerald-300 text-xs font-bold uppercase tracking-wide animate-in fade-in">
          <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Eggs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {eggs.filter(egg => {
          const isCurrent = server?.eggId === egg.id || (server?.docker_image === egg.docker_image && server?.nest === egg.nest);
          if (isCurrent) return true;
          if (currentRam < 2048 && (egg.nest === 'Minecraft' || egg.name.toLowerCase().includes('minecraft'))) {
            return false;
          }
          if (server?.allowedEggs && Array.isArray(server.allowedEggs) && server.allowedEggs.length > 0) {
            return server.allowedEggs.includes(egg.id);
          }
          return true;
        }).map((egg) => {
          const isCurrent = server?.eggId === egg.id || (server?.docker_image === egg.docker_image && server?.nest === egg.nest);
          const isMinecraft = egg.nest === 'Minecraft' || egg.name.toLowerCase().includes('minecraft');
          const isLocked = isMinecraft && currentRam < 2048;

          return (
            <div 
              key={egg.id}
              className={`bg-[#121317]/95 border p-5 rounded-2xl transition-all flex flex-col justify-between ${
                isCurrent 
                  ? "border-emerald-500/40 bg-emerald-950/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                  : isLocked 
                  ? "border-red-500/20 bg-red-950/5 opacity-75" 
                  : "border-white/10 hover:border-purple-500/40 hover:shadow-lg"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    isMinecraft ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  }`}>
                    {egg.nest || "General"}
                  </span>
                  {isCurrent && (
                    <span className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Active Engine
                    </span>
                  )}
                  {isLocked && !isCurrent && (
                    <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Locked (&lt;2GB RAM)
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-white mb-1">{egg.name}</h3>
                <p className="text-xs text-white/50 leading-relaxed mb-4">{egg.description || "No description provided for this template."}</p>

                <div className="bg-black/50 border border-white/5 rounded-lg p-2.5 mb-4 font-mono text-[11px] text-white/60 truncate">
                  <span className="text-white/30 mr-1.5">$</span>
                  {egg.startup_command || "default startup"}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5">
                {isCurrent ? (
                  <button 
                    disabled
                    className="w-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-default flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Currently Equipped
                  </button>
                ) : isLocked ? (
                  <button 
                    disabled
                    className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Requires 2048 MB+ RAM
                  </button>
                ) : (
                  <button 
                    onClick={() => handleSwitch(egg.id)}
                    disabled={switchingId !== null}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-purple-500/25 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {switchingId === egg.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Switching Engine...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Switch to {egg.name}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
