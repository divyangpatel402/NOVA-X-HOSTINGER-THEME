"use client";
import React, { useEffect, useState } from "react"; 
import { Search, Download, RefreshCw, Puzzle, AlertCircle, Box, Server, Cpu, AlertTriangle } from "lucide-react";
import { confirmDialog } from "@/components/NovaConfirmModal";

interface Plugin {
  id: string;
  source: 'modrinth' | 'spigot' | 'hangar';
  name: string;
  tag: string;
  downloads: number;
  rating: number;
  icon: string | null;
}

export default function PluginManager({ serverId }: { serverId: string }) {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(false);
  const [isInstalling, setIsInstalling] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeSource, setActiveSource] = useState<'all' | 'modrinth' | 'spigot' | 'hangar'>('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const searchPlugins = async (searchQuery: string = "essentials") => {
    try {
      setLoading(true);
      setError('');
      
      const q = searchQuery.trim() || 'essentials';
      const results: Plugin[] = [];
      const promises = [];
      
      if (activeSource === 'all' || activeSource === 'modrinth') {
        promises.push(
          fetch(`https://api.modrinth.com/v2/search?query=${q}&facets=[["project_type:plugin"]]&limit=15`)
            .then(res => res.json())
            .then(data => {
              data.hits.forEach((hit: any) => {
                results.push({
                  id: hit.project_id,
                  source: 'modrinth',
                  name: hit.title,
                  tag: hit.description,
                  downloads: hit.downloads,
                  rating: 0,
                  icon: hit.icon_url
                });
              });
            }).catch(() => {})
        );
      }
      
      if (activeSource === 'all' || activeSource === 'spigot') {
        promises.push(
          fetch(`https://api.spiget.org/v2/search/resources/${q}?field=name&size=15&page=1`)
            .then(res => res.json())
            .then(data => {
              if(Array.isArray(data)) {
                data.forEach((hit: any) => {
                  results.push({
                    id: hit.id.toString(),
                    source: 'spigot',
                    name: hit.name,
                    tag: hit.tag,
                    downloads: hit.downloads,
                    rating: hit.rating ? hit.rating.average : 0,
                    icon: hit.icon?.url ? `https://spigotmc.org/${hit.icon.url}` : null
                  });
                });
              }
            }).catch(() => {})
        );
      }

      if (activeSource === 'all' || activeSource === 'hangar') {
        promises.push(
          fetch(`https://hangar.papermc.io/api/v1/projects?q=${q}&limit=15`)
            .then(res => res.json())
            .then(data => {
              if (data && data.result) {
                data.result.forEach((hit: any) => {
                  results.push({
                    id: `${hit.namespace.owner}/${hit.namespace.slug}`,
                    source: 'hangar',
                    name: hit.name,
                    tag: hit.description,
                    downloads: hit.stats?.downloads || 0,
                    rating: 0,
                    icon: null
                  });
                });
              }
            }).catch(() => {})
        );
      }

      await Promise.all(promises);
      
      results.sort((a, b) => b.downloads - a.downloads);
      setPlugins(results);
    } catch (e: any) {
      console.error(e);
      setPlugins([]);
      setError("Failed to fetch plugins.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchPlugins();
  }, [activeSource]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchPlugins(query);
  };

  const handleInstall = async (plugin: Plugin) => {
    if (!await confirmDialog(`Are you sure you want to install ${plugin.name}?`, "Install Plugin", "info")) return;
    try {
      setIsInstalling(plugin.id);
      setError('');
      setSuccess('');
      
      const res = await fetch(`/api/admin/servers/${serverId}/plugins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: plugin.source,
          pluginId: plugin.id,
          pluginName: plugin.name
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to install plugin");
      
      setSuccess(data.message || `${plugin.name} installed successfully! Restart the server to apply changes.`);
    } catch (e: any) {
      setError(e.message || "Failed to install plugin.");
    } finally {
      setIsInstalling(null);
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'modrinth': return <Box className="w-3 h-3 text-[#10b981]" />;
      case 'spigot': return <Server className="w-3 h-3 text-[#f59e0b]" />;
      case 'hangar': return <Cpu className="w-3 h-3 text-[#3b82f6]" />;
      default: return <Puzzle className="w-3 h-3 text-[#ff0f0f]" />;
    }
  };

  const getSourceName = (source: string) => {
    switch (source) {
      case 'modrinth': return 'Modrinth';
      case 'spigot': return 'SpigotMC';
      case 'hangar': return 'Paper Hangar';
      default: return source;
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
              <Puzzle className="w-5 h-5 text-[#ff0f0f]" />
              <div>
                <h3 className="font-black text-white uppercase tracking-wider text-sm">Plugin Manager</h3>
                <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Install plugins from Modrinth, Spigot, & Hangar</p>
              </div>
            </div>
            
            <form onSubmit={handleSearch} className="flex flex-1 max-w-sm gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search plugins..."
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
          
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
            {['all', 'modrinth', 'spigot', 'hangar'].map(src => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveSource(src as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex items-center gap-1.5 ${activeSource === src ? 'bg-[#ff0f0f] text-white shadow-[0_0_15px_rgba(255,15,15,0.3)]' : 'bg-white/5 border border-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
              >
                {src === 'all' ? <Puzzle className="w-3.5 h-3.5" /> : getSourceIcon(src)}
                {src === 'all' ? 'All Sources' : getSourceName(src)}
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-0 max-h-[500px] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="p-12 text-center text-white/50 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin mb-3 text-[#ff0f0f]" />
              Searching repositories...
            </div>
          ) : plugins.length === 0 ? (
            <div className="p-12 text-center text-white/50 flex flex-col items-center">
              <AlertCircle className="w-8 h-8 mb-3 text-white/20" />
              <h4 className="text-white font-bold mb-1">No plugins found.</h4>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {plugins.map((plugin) => (
                <div key={`${plugin.source}-${plugin.id}`} className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0 overflow-hidden border border-white/10">
                      {plugin.icon ? (
                         <img src={plugin.icon} alt={plugin.name} className="w-full h-full object-cover" />
                      ) : (
                         <Puzzle className="w-5 h-5 text-white/20" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                         <h4 className="font-bold text-white truncate">{plugin.name}</h4>
                         <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-white/10 text-white/60 flex items-center gap-1 border border-white/5">
                            {getSourceIcon(plugin.source)} {plugin.source}
                         </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-2 mt-1 font-mono">{plugin.tag}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-white/40 uppercase font-bold tracking-wider">
                        {plugin.downloads > 0 && (
                          <span className="flex items-center gap-1" title="Downloads">
                            <Download className="w-3.5 h-3.5 text-[#3b82f6]" />
                            {plugin.downloads.toLocaleString()} DLs
                          </span>
                        )}
                        {plugin.rating > 0 && (
                          <span title="Rating" className="text-[#f59e0b]">⭐ {plugin.rating.toFixed(1)}/5</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleInstall(plugin)}
                    disabled={isInstalling !== null}
                    className="w-full md:w-auto px-4 py-2 bg-white/5 hover:bg-[#ff0f0f]/10 border border-white/10 hover:border-[#ff0f0f]/30 text-white hover:text-[#ff0f0f] rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center shrink-0 disabled:opacity-50"
                  >
                    {isInstalling === plugin.id ? (
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
