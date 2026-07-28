"use client";
import { Terminal, Cpu, HardDrive, Network, Wifi, Clock } from 'lucide-react';

export default function ServerConsole() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Console Window */}
      <div className="lg:col-span-3 flex flex-col h-[600px] bg-[#121317]/90 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="flex-1 p-4 font-mono text-sm overflow-y-auto space-y-1">
          <p className="text-yellow-400">container@pterodactyl~ <span className="text-white/70">Server marked as offline...</span></p>
        </div>
        <div className="border-t border-white/10 bg-[#0a0a0f] p-3 flex items-center">
          <span className="text-white/40 mr-2">&raquo;</span>
          <input type="text" placeholder="Type a command..." className="w-full bg-transparent outline-none text-white font-mono text-sm placeholder:text-white/30" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        <div className="bg-[#121317]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Wifi className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase mb-1">Address</p>
            <p className="text-sm font-semibold">node.novaxsmp.site:25580</p>
          </div>
        </div>

        <div className="bg-[#121317]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
            <Clock className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase mb-1">Uptime</p>
            <p className="text-sm font-semibold">Offline</p>
          </div>
        </div>

        <div className="bg-[#121317]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Cpu className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase mb-1">CPU Load</p>
            <p className="text-sm font-semibold">Offline</p>
          </div>
        </div>
        
        <div className="bg-[#121317]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <HardDrive className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase mb-1">Memory</p>
            <p className="text-sm font-semibold">Offline</p>
          </div>
        </div>
        
        <div className="bg-[#121317]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <HardDrive className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase mb-1">Disk</p>
            <p className="text-sm font-semibold">118.72 MiB <span className="text-white/30">/ &infin;</span></p>
          </div>
        </div>
        
        <div className="bg-[#121317]/80 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
            <Network className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <p className="text-white/50 text-xs font-bold uppercase mb-1">Network</p>
            <p className="text-sm font-semibold">Offline</p>
          </div>
        </div>
      </div>
    </div>
  );
}
