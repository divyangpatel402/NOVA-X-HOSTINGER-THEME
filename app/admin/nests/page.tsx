"use client";
import { useState, useEffect, useRef } from 'react';
import { Egg, Upload, Trash2, Search, Filter, Plus, CheckSquare, Square, AlertTriangle, Layers, X, Sparkles } from 'lucide-react';
import { confirmDialog } from '@/components/NovaConfirmModal';

export default function NestsPage() {
  const [showImport, setShowImport] = useState(false);
  const [showCreateNest, setShowCreateNest] = useState(false);
  const [showCreateEgg, setShowCreateEgg] = useState(false);
  const [eggs, setEggs] = useState<any[]>([]);
  const [nests, setNests] = useState<string[]>(["Game Servers", "Discord Bot", "Web Hosting", "Minecraft"]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedNest, setSelectedNest] = useState('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form states
  const [nestName, setNestName] = useState('Game Servers');
  const [importing, setImporting] = useState(false);
  const [newNestName, setNewNestName] = useState('');
  const [newNestDesc, setNewNestDesc] = useState('');

  // Create Egg form states
  const [ceggName, setCeggName] = useState('');
  const [ceggDesc, setCeggDesc] = useState('');
  const [ceggNest, setCeggNest] = useState('');
  const [ceggDocker, setCeggDocker] = useState('');
  const [ceggStartup, setCeggStartup] = useState('');
  const [ceggAuthor, setCeggAuthor] = useState('NOVA X');
  const [creatingEgg, setCreatingEgg] = useState(false);

  useEffect(() => {
    fetchEggsAndNests();
  }, []);

  const fetchEggsAndNests = async () => {
    setLoading(true);
    try {
      const [eggsRes, nestsRes] = await Promise.all([
        fetch('/api/admin/eggs'),
        fetch('/api/admin/nests')
      ]);
      const eggsData = await eggsRes.json();
      const nestsData = await nestsRes.json();

      if (eggsData.success) {
        setEggs(eggsData.eggs || []);
      }
      if (nestsData.success && nestsData.nests) {
        setNests(nestsData.nests);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNestName) return alert("Please enter a Nest name");
    try {
      const res = await fetch('/api/admin/nests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newNestName, description: newNestDesc })
      });
      if (res.ok) {
        setShowCreateNest(false);
        setNewNestName('');
        setNewNestDesc('');
        fetchEggsAndNests();
      } else {
        alert("Failed to create nest");
      }
    } catch (err) {
      alert("Error creating nest");
    }
  };

  const handleCreateEgg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ceggName) return alert("Please enter an Egg name");
    if (!ceggNest) return alert("Please select a Nest for this Egg");
    setCreatingEgg(true);
    try {
      const res = await fetch('/api/admin/eggs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: ceggName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36),
          name: ceggName,
          description: ceggDesc,
          nest: ceggNest,
          docker_image: ceggDocker,
          startup_command: ceggStartup,
          author: ceggAuthor || 'NOVA X'
        })
      });
      if (res.ok) {
        setShowCreateEgg(false);
        setCeggName(''); setCeggDesc(''); setCeggNest(''); setCeggDocker(''); setCeggStartup(''); setCeggAuthor('NOVA X');
        fetchEggsAndNests();
      } else {
        alert("Failed to create egg");
      }
    } catch (err) {
      alert("Error creating egg");
    } finally {
      setCreatingEgg(false);
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return alert("Please select a JSON file");

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        
        const payload = {
          id: Date.now().toString(),
          name: content.name || 'Unknown Egg',
          description: content.description || '',
          nest: nestName,
          docker_image: content.image || content.docker_images ? (typeof content.docker_images === 'object' ? Object.values(content.docker_images)[0] : content.docker_images) : 'ghcr.io/pterodactyl/yolks:java_17',
          startup_command: content.startup || '',
          author: content.author || 'NOVA X'
        };

        const res = await fetch('/api/admin/eggs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          setShowImport(false);
          fetchEggsAndNests();
        } else {
          alert("Failed to import egg");
        }
      } catch (err) {
        alert("Invalid JSON file");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteEgg = async (id: string, name: string) => {
    if (!await confirmDialog(`Are you sure you want to delete server engine / egg "${name}"?`, "Delete Egg", "danger")) return;
    try {
      const res = await fetch(`/api/admin/eggs?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setEggs(prev => prev.filter(e => e.id !== id));
        setSelectedIds(prev => prev.filter(i => i !== id));
      } else {
        alert("Failed to delete egg.");
      }
    } catch (err) {
      alert("Error deleting egg.");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!await confirmDialog(`Are you sure you want to delete ${selectedIds.length} selected eggs?`, "Bulk Delete Eggs", "danger")) return;
    try {
      const res = await fetch(`/api/admin/eggs`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setEggs(prev => prev.filter(e => !selectedIds.includes(e.id)));
        setSelectedIds([]);
      } else {
        alert("Failed to bulk delete eggs.");
      }
    } catch (err) {
      alert("Error during bulk delete.");
    }
  };

  const handleWipeAllEggs = async () => {
    if (!await confirmDialog("⚠️ MASS DELETE WARNING:\n\nAre you sure you want to DELETE ALL EGGS from the database? This will give you a 100% clean slate to upload/create only your custom nests and eggs!", "Wipe All Eggs", "danger")) return;
    try {
      const res = await fetch(`/api/admin/eggs?all=true`, { method: 'DELETE' });
      if (res.ok) {
        setEggs([]);
        setSelectedIds([]);
        alert("All eggs have been deleted! You now have a clean slate.");
      } else {
        alert("Failed to wipe all eggs.");
      }
    } catch (err) {
      alert("Error wiping eggs.");
    }
  };

  const handleDeleteNest = async (nestName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!await confirmDialog(`Are you sure you want to delete nest "${nestName}"? This is permanent.`, "Delete Nest", "danger")) return;
    try {
      const res = await fetch(`/api/admin/nests?name=${encodeURIComponent(nestName)}`, { method: 'DELETE' });
      if (res.ok) {
        setNests(prev => prev.filter(n => n !== nestName));
        if (selectedNest === nestName) setSelectedNest('All');
        fetchEggsAndNests();
      } else {
        alert("Failed to delete nest.");
      }
    } catch (err) {
      alert("Error deleting nest.");
    }
  };

  const handleWipeAllNests = async () => {
    if (!await confirmDialog("⚠️ MASS DELETE WARNING:\n\nAre you sure you want to DELETE ALL NESTS from the database? This will remove all default and custom nests so you can create your own from scratch!", "Wipe All Nests", "danger")) return;
    try {
      const res = await fetch(`/api/admin/nests?all=true`, { method: 'DELETE' });
      if (res.ok) {
        setNests([]);
        setSelectedNest('All');
        alert("All nests have been wiped!");
        fetchEggsAndNests();
      } else {
        alert("Failed to wipe all nests.");
      }
    } catch (err) {
      alert("Error wiping nests.");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredEggs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEggs.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const allNestsList = ['All', ...Array.from(new Set([...nests, ...eggs.map(e => e.nest || 'General')]))];

  const filteredEggs = eggs.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || 
                          (e.description && e.description.toLowerCase().includes(search.toLowerCase())) ||
                          (e.nest && e.nest.toLowerCase().includes(search.toLowerCase()));
    const matchesNest = selectedNest === 'All' || e.nest === selectedNest;
    return matchesSearch && matchesNest;
  });

  // Calculate egg counts per nest
  const nestCounts: Record<string, number> = {};
  allNestsList.forEach(nest => {
    if (nest === 'All') {
      nestCounts[nest] = eggs.length;
    } else {
      nestCounts[nest] = eggs.filter(e => (e.nest || 'General') === nest).length;
    }
  });

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2.5">
            <Egg className="w-6 h-6 text-[#ff0f0f]" />
            Nests & A-to-Z Server Engines
          </h2>
          <p className="text-xs text-white/50 mt-1">Create Nests, import Pterodactyl eggs, and manage server runtime images ({eggs.length} installed).</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            type="button" 
            onClick={() => setShowCreateNest(true)} 
            className="bg-white/10 hover:bg-white/15 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-white/10"
          >
            <Plus className="w-4 h-4 text-[#ff0f0f]" /> Create New Nest
          </button>
          <button 
            type="button" 
            onClick={() => setShowImport(true)} 
            className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff0f0f]/20 cursor-pointer"
          >
            <Upload className="w-4 h-4" /> Import Egg (JSON)
          </button>
          <button 
            type="button" 
            onClick={() => { setCeggNest(selectedNest !== 'All' ? selectedNest : (nests[0] || 'General')); setShowCreateEgg(true); }} 
            className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" /> Create Egg Manually
          </button>
          {nests.length > 0 && (
            <button 
              type="button" 
              onClick={handleWipeAllNests} 
              className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              title="Delete ALL Nests from database to start fresh"
            >
              <Trash2 className="w-4 h-4" /> Wipe All Nests
            </button>
          )}
          {eggs.length > 0 && (
            <button 
              type="button" 
              onClick={handleWipeAllEggs} 
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
              title="Delete ALL Eggs from database to start fresh"
            >
              <Trash2 className="w-4 h-4" /> Wipe All Eggs
            </button>
          )}
        </div>
      </div>

      {/* Nest Overview / Organization Panel */}
      <div className="bg-[#121317] border border-white/5 p-4 rounded-2xl">
        <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
          <span className="text-xs font-black text-[#ff0f0f] uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> Installed Nests & Uploaded Egg Count
          </span>
          <span className="text-[11px] text-white/40">Select a Nest tab to view its uploaded eggs</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {allNestsList.map(nest => (
            <div
              key={nest}
              className={`group flex items-center rounded-xl border transition-all ${
                selectedNest === nest 
                  ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border-[#ff0f0f]/40 shadow-md shadow-[#ff0f0f]/10' 
                  : 'bg-black/30 text-white/60 border-white/5 hover:text-white hover:bg-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => setSelectedNest(nest)}
                className="px-3.5 py-2 text-xs font-bold transition-all cursor-pointer flex items-center gap-2"
              >
                <span>{nest}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                  selectedNest === nest ? 'bg-[#ff0f0f] text-white' : 'bg-white/10 text-white/50'
                }`}>
                  {nestCounts[nest] || 0}
                </span>
              </button>
              {nest !== 'All' && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteNest(nest, e)}
                  className="pr-2.5 pl-1 py-2 text-white/30 hover:text-red-400 transition-colors cursor-pointer"
                  title={`Delete nest "${nest}"`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bulk Selection Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-[#ff0f0f]/10 border border-[#ff0f0f]/30 p-3 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-[#ff0f0f]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Selected: <span className="text-[#ff0f0f]">{selectedIds.length}</span> Server Eggs
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setSelectedIds([])} 
              className="text-xs text-white/60 hover:text-white uppercase font-bold cursor-pointer"
            >
              Deselect All
            </button>
            <button 
              type="button" 
              onClick={handleBulkDelete} 
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected ({selectedIds.length})
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#121317] border border-white/5 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-white/40 uppercase flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Active Filter: <span className="text-white">{selectedNest}</span>
          </span>
          {selectedNest !== 'All' && (
            <button 
              type="button" 
              onClick={() => setSelectedNest('All')} 
              className="text-[11px] text-[#ff0f0f] underline ml-2 cursor-pointer font-bold"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Search languages, games, bots..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#ff0f0f]/50 transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50 border-b border-white/5">
            <tr>
              <th className="p-4 w-12 text-center">
                <button type="button" onClick={toggleSelectAll} className="cursor-pointer text-white/60 hover:text-white">
                  {filteredEggs.length > 0 && selectedIds.length === filteredEggs.length ? (
                    <CheckSquare className="w-4 h-4 text-[#ff0f0f]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Description</th>
              <th className="p-4 font-semibold">Nest</th>
              <th className="p-4 font-semibold">Author</th>
              <th className="p-4 font-semibold">Docker Image</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-white/50 animate-pulse">Loading server engines...</td></tr>
            ) : filteredEggs.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-10 text-center text-white/40">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Egg className="w-8 h-8 text-white/20" />
                    <span className="font-bold text-sm text-white/60">No Eggs found in this Nest</span>
                    <span className="text-xs text-white/30">Click "+ Create New Nest" or "Import Egg (JSON)" to upload your server engines.</span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEggs.map((egg) => {
                const isSelected = selectedIds.includes(egg.id);
                return (
                  <tr key={egg.id} className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-[#ff0f0f]/5' : ''}`}>
                    <td className="p-4 text-center">
                      <button type="button" onClick={() => toggleSelect(egg.id)} className="cursor-pointer text-white/60 hover:text-white">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-[#ff0f0f]" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="p-4 text-blue-400 font-bold">{egg.name}</td>
                    <td className="p-4 text-white/60 text-xs truncate max-w-[220px]" title={egg.description}>{egg.description || '-'}</td>
                    <td className="p-4">
                      <span className="bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase">
                        {egg.nest || 'General'}
                      </span>
                    </td>
                    <td className="p-4 text-white/60 text-xs">{egg.author}</td>
                    <td className="p-4 text-white/40 font-mono text-[11px] truncate max-w-[200px]" title={egg.docker_image}>{egg.docker_image}</td>
                    <td className="p-4 text-right">
                      <button 
                        type="button"
                        onClick={() => handleDeleteEgg(egg.id, egg.name)}
                        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                        title="Delete Egg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create New Nest Modal */}
      {showCreateNest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-[#121317] border border-white/15 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#ff0f0f]" />
                Create New Nest (Category)
              </h3>
              <button type="button" onClick={() => setShowCreateNest(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateNest} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#ff0f0f] uppercase mb-1.5">Nest Name <span className="text-white/30 italic font-normal">required</span></label>
                <input 
                  type="text" 
                  required
                  value={newNestName} 
                  onChange={e => setNewNestName(e.target.value)} 
                  placeholder="e.g. Voice Servers, Rust Variations, Databases"
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-[#ff0f0f]/50" 
                />
              </div>
              <div>
                <label className="block font-bold text-white/60 uppercase mb-1.5">Description <span className="text-white/30 italic font-normal">optional</span></label>
                <textarea 
                  rows={2}
                  value={newNestDesc} 
                  onChange={e => setNewNestDesc(e.target.value)} 
                  placeholder="Brief description of what engines go inside this nest..."
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#ff0f0f]/50" 
                />
              </div>
              <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateNest(false)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md">
                  Create Nest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Egg Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4">
          <div className="bg-[#121317] border border-white/15 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-[#ff0f0f]" />
                Import Pterodactyl Egg (JSON)
              </h3>
              <button type="button" onClick={() => setShowImport(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#ff0f0f] uppercase mb-2">Egg File (.json) <span className="text-white/30 italic font-normal">required</span></label>
                <input ref={fileInputRef} type="file" accept=".json" className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-2.5 text-xs text-white/70 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#ff0f0f]/20 file:text-[#ff0f0f] hover:file:bg-[#ff0f0f]/30 cursor-pointer" />
                <p className="text-[11px] text-white/40 mt-1.5">Select a standard Pterodactyl or Pelican .json egg file from your PC.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#ff0f0f] uppercase mb-2">Target Nest / Category <span className="text-white/30 italic font-normal">required</span></label>
                <select value={nestName} onChange={e => setNestName(e.target.value)} className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-[#ff0f0f]/50">
                  {allNestsList.filter(n => n !== 'All').map(nest => (
                    <option key={nest} value={nest}>{nest}</option>
                  ))}
                </select>
                <p className="text-[11px] text-white/40 mt-1.5">The egg will be uploaded directly into the selected Nest.</p>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-white/[0.02]">
              <button type="button" onClick={() => setShowImport(false)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={handleImport} disabled={importing} className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md">
                {importing ? 'Importing Egg...' : 'Import Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Egg Manually Modal */}
      {showCreateEgg && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in p-4 overflow-y-auto">
          <div className="bg-[#121317] border border-white/15 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Create Server Engine / Egg Manually
              </h3>
              <button type="button" onClick={() => setShowCreateEgg(false)} className="text-white/50 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateEgg} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-emerald-400 uppercase mb-1.5">Engine / Egg Name <span className="text-white/30 italic font-normal">required</span></label>
                <input 
                  type="text" 
                  required
                  value={ceggName} 
                  onChange={e => setCeggName(e.target.value)} 
                  placeholder="e.g. Node.js 20 Custom, Rust Gen, CS2 Dedicated"
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white font-bold outline-none focus:border-emerald-500/50" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase mb-1.5">Target Nest / Category <span className="text-white/30 italic font-normal">required</span></label>
                <select 
                  value={ceggNest} 
                  onChange={e => setCeggNest(e.target.value)} 
                  required
                  className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs font-bold text-white outline-none focus:border-emerald-500/50"
                >
                  <option value="" disabled>Select a Nest...</option>
                  {allNestsList.filter(n => n !== 'All').map(nest => (
                    <option key={nest} value={nest}>{nest}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase mb-1.5">Docker Image <span className="text-white/30 italic font-normal">required</span></label>
                <input 
                  type="text" 
                  required
                  value={ceggDocker} 
                  onChange={e => setCeggDocker(e.target.value)} 
                  placeholder="e.g. ghcr.io/pterodactyl/yolks:nodejs_20 or ghcr.io/pterodactyl/games:cs2"
                  className="w-full bg-[#0a0a0f] font-mono border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/70 uppercase mb-1.5">Startup Command <span className="text-white/30 italic font-normal">required</span></label>
                <textarea 
                  rows={4}
                  required
                  value={ceggStartup} 
                  onChange={e => setCeggStartup(e.target.value)} 
                  placeholder="e.g. if [[ -d .git ]] && [[ {{AUTO_UPDATE}} == '1' ]]; then git pull; fi; ..."
                  className="w-full bg-[#0a0a0f] font-mono border border-white/10 rounded-xl p-3 text-xs text-emerald-300 outline-none focus:border-emerald-500/50" 
                />
                <p className="text-[10px] text-white/40 mt-1">Real-time working startup command for container execution.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Author</label>
                  <input 
                    type="text" 
                    value={ceggAuthor} 
                    onChange={e => setCeggAuthor(e.target.value)} 
                    placeholder="NOVA X"
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1.5">Description</label>
                  <input 
                    type="text" 
                    value={ceggDesc} 
                    onChange={e => setCeggDesc(e.target.value)} 
                    placeholder="Optional short description..."
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500/50" 
                  />
                </div>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateEgg(false)} className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={creatingEgg} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md">
                  {creatingEgg ? 'Creating Egg...' : 'Create Egg Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
