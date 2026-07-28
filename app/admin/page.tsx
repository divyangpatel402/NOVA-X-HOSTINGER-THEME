"use client";
import { useState, useEffect } from 'react';
import { Cpu, HardDrive, Server, Users, Layers, Box, Activity, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ servers: 0, users: 0, allocations: 0, nests: 0 });
  const [sysStats, setSysStats] = useState<any>(null);

  useEffect(() => {
    fetchStats();
    fetchSysStats();
    const interval = setInterval(fetchSysStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const eggsRes = await fetch('/api/admin/eggs');
      const serversRes = await fetch('/api/admin/servers');
      const eggsData = await eggsRes.json();
      const serversData = await serversRes.json();

      setStats({
        servers: serversData.servers?.length || 0,
        users: 1,
        allocations: serversData.servers?.length || 0,
        nests: eggsData.eggs?.length || 0
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSysStats = async () => {
    try {
      const res = await fetch('/api/admin/system/stats');
      if (res.ok) {
        const data = await res.json();
        setSysStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes) return "0 GB";
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0d 0h 0m";
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  };

  return (
    <div className="space-y-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-wider">System Overview</h2>
          <p className="text-xs text-white/40 uppercase tracking-widest mt-0.5">Real-time panel and daemon diagnostics</p>
        </div>
        {sysStats && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            Daemon Online
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#050508] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Total Servers</p>
              <p className="text-3xl font-black mt-2 text-white font-mono">{stats.servers}</p>
            </div>
            <div className="p-3 bg-[#ff0f0f]/10 rounded-xl text-[#ff0f0f] border border-[#ff0f0f]/20 group-hover:scale-110 transition-transform">
              <Server className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[#050508] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Active Users</p>
              <p className="text-3xl font-black mt-2 text-white font-mono">{stats.users}</p>
            </div>
            <div className="p-3 bg-[#3b82f6]/10 rounded-xl text-[#3b82f6] border border-[#3b82f6]/20 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[#050508] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Allocations</p>
              <p className="text-3xl font-black mt-2 text-white font-mono">{stats.allocations}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400 border border-purple-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-[#050508] border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-white/20 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Eggs / Nests</p>
              <p className="text-3xl font-black mt-2 text-white font-mono">{stats.nests}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-transform">
              <Box className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time System Resource Usage */}
      <div className="bg-[#050508] border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-[#ff0f0f]" />
            <h3 className="font-black text-white uppercase tracking-wider text-sm">Host Node Telemetry</h3>
          </div>
          {sysStats && (
            <div className="flex items-center gap-4 text-xs font-mono text-white/50">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-[#3b82f6]" /> Uptime: {formatUptime(sysStats.uptime)}</span>
              <span>•</span>
              <span>OS: {sysStats.platform} ({sysStats.arch})</span>
              <span>•</span>
              <span>CPUs: {sysStats.cpus} Cores</span>
            </div>
          )}
        </div>

        {sysStats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* CPU Metric */}
            <div className="bg-[#121317]/50 border border-white/5 p-5 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-white/70 uppercase tracking-wider flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[#ff0f0f]" /> CPU Load Avg
                </span>
                <span className="font-mono text-sm font-bold text-white">{sysStats.cpuUsage}%</span>
              </div>
              <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${sysStats.cpuUsage > 80 ? 'bg-red-500' : sysStats.cpuUsage > 50 ? 'bg-amber-500' : 'bg-[#ff0f0f]'}`}
                  style={{ width: `${Math.min(100, sysStats.cpuUsage)}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-2">Represents overall system processing load</p>
            </div>

            {/* RAM Metric */}
            <div className="bg-[#121317]/50 border border-white/5 p-5 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-white/70 uppercase tracking-wider flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-[#3b82f6]" /> Memory Usage
                </span>
                <span className="font-mono text-sm font-bold text-white">{sysStats.ramUsage}% ({formatBytes(sysStats.usedMemory)} / {formatBytes(sysStats.totalMemory)})</span>
              </div>
              <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${sysStats.ramUsage > 85 ? 'bg-red-500' : sysStats.ramUsage > 60 ? 'bg-amber-500' : 'bg-[#3b82f6]'}`}
                  style={{ width: `${Math.min(100, sysStats.ramUsage)}%` }}
                />
              </div>
              <p className="text-[10px] text-white/40 mt-2">Physical memory consumed by containers and panel</p>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-white/40 font-mono text-sm animate-pulse">
            Connecting to host telemetry service...
          </div>
        )}
      </div>
    </div>
  );
}
