"use client";
import React, { useEffect, useState } from "react"; 
import { Search, Download, RefreshCw, AlertCircle, Box, AlertTriangle } from "lucide-react";
import { confirmDialog } from "@/components/NovaConfirmModal";

interface Mod {
  id: string;
  name: string;
  tag: string;
  downloads: number;
  icon: string | null;
}

export default function ModManager({ serverId }: { serverId: string }) {
  const [mods, setMods] = useState<Mod[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchMods = async (searchQuery: string = "jei") => {
    try {
      setLoading(true);
      setError('');
      
      const q = searchQuery.trim() || 'jei';
      const results: Mod[] = [];
      
      const res = await fetch(`https://api.modrinth.com/v2/search?query=${q}&facets=[["project_type:mod"]]&limit=15`);
      const data = await res.json();
      
      if (data && data.hits) {
        data.hits.forEach((hit: any) => {
          results.push({
            id: hit.project_id,
            name: hit.title,
            tag: hit.description,
            downloads: hit.downloads,
            icon: hit.icon_url
          });
        });
      }
      
      results.sort((a, b) => b.downloads - a.downloads);
      setMods(results);
    } catch (e: any) {
      console.error(e);
      setError('Failed to fetch mods.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchMods();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMods(query);
  };

  const handleInstall = async (mod: Mod) => {
    if (!await confirmDialog(`Are you sure you want to install ${mod.name}?`, "Install Mod", "info")) return;
    try {
      setIsInstalling(mod.id);
      setError('');
      setSuccess('');
      
      const res = await fetch(`/api/admin/servers/${serverId}/mods`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pluginId: mod.id,
          pluginName: mod.name
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to install mod");
      
      setSuccess(data.message || `${mod.name} installed successfully! Restart the server to apply changes.`);
    } catch (e: any) {
      setError(e.message || "Failed to install mod.");
    } finally {
      setIsInstalling(null);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
          <RefreshCw className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="bg-[#050508] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="p-4 border-b border-white/5 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex items-center gap-3">
              <Box className="w-5 h-5 text-[#ff0f0f]" />
              <div>
                <h3 className="font-black text-white uppercase tracking-wider text-sm">Mod Manager</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Search and install mods from Modrinth</p>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="flex flex-1 max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search mods..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#ff0f0f]/50 transition-colors font-mono"
                />
              </div>
              <button 
                type="submit"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg text-sm font-bold transition-colors whitespace-nowrap shrink-0"
              >
                Search
              </button>
            </form>
          </div>
        </div>
        
        <div className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center text-white/50 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#ff0f0f]" />
              Searching repositories...
            </div>
          ) : mods.length === 0 ? (
            <div className="p-12 text-center text-white/50 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-3 text-white/20" />
              <h4 className="text-white font-bold mb-1">No mods found.</h4>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {mods.map((mod) => (
                <div key={mod.id} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                      {mod.icon ? (
                         <img src={mod.icon} alt={mod.name} className="w-full h-full object-cover" />
                      ) : (
                         <Box className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                         <h4 className="font-bold text-white truncate">{mod.name}</h4>
                         <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white/60 flex items-center gap-1 border border-white/5">
                            Modrinth
                         </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-2 mt-1 font-mono">{mod.tag}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-white/40 uppercase font-bold tracking-wider">
                        {mod.downloads > 0 && (
                          <span className="flex items-center gap-1" title="Downloads">
                            <Download className="w-3.5 h-3.5 text-[#3b82f6]" />
                            {mod.downloads.toLocaleString()} DLs
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleInstall(mod)}
                    disabled={isInstalling !== null}
                    className="w-full md:w-auto px-4 py-2 bg-white/5 hover:bg-[#ff0f0f]/10 border border-white/10 hover:border-[#ff0f0f]/30 text-white hover:text-[#ff0f0f] rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    {isInstalling === mod.id ? (
                      <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Installing...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" /> Install</>
                    )}
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
