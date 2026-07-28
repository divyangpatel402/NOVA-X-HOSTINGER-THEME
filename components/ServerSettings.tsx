"use client";
import { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

const serverTypes = [
  { value: 'PAPER', label: 'Paper' },
  { value: 'PURPUR', label: 'Purpur' },
  { value: 'FORGE', label: 'Forge' },
  { value: 'FABRIC', label: 'Fabric' },
  { value: 'VANILLA', label: 'Vanilla' },
  { value: 'VELOCITY', label: 'Velocity' },
  { value: 'BUNGEECORD', label: 'BungeeCord' },
  { value: 'WATERFALL', label: 'Waterfall' }
];

export default function ServerSettings({ server, onUpdate }: { server: any, onUpdate: () => void }) {
  const [loading, setLoading] = useState(false);
  const [versions, setVersions] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState(server.type || 'PAPER');
  const [selectedVersion, setSelectedVersion] = useState(server.version || 'latest');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchVersions(selectedType);
  }, [selectedType]);

  const fetchVersions = async (type: string) => {
    try {
      const res = await fetch(`/api/admin/servers/${server.id}/settings?type=${type}`);
      const data = await res.json();
      if (data.success && data.versions) {
        setVersions(data.versions);
        if (!data.versions.includes(selectedVersion)) {
           setSelectedVersion(data.versions[0] || 'latest');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (server.status === 'online') {
      setError("Server must be stopped before changing settings.");
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await fetch(`/api/admin/servers/${server.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: selectedType, version: selectedVersion })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess("Settings updated successfully! Server container has been rebuilt.");
        onUpdate();
      } else {
        setError(data.error || "Failed to update settings.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
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
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="bg-[#050508] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#121317] border-b border-white/5 px-6 py-4 flex items-center gap-3">
          <Settings className="w-5 h-5 text-[#ff0f0f]" />
          <h3 className="font-black text-white uppercase tracking-wider text-sm">Startup & Version Settings</h3>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Server Software / Type</label>
              <div className="relative">
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-[#ff0f0f]/50 transition-colors font-mono text-sm"
                >
                  {serverTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                  ▼
                </div>
              </div>
              <p className="text-xs text-white/40 mt-1">Changing software will delete incompatible configs (like paper.yml).</p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Software Version</label>
              <div className="relative">
                <select 
                  value={selectedVersion}
                  onChange={(e) => setSelectedVersion(e.target.value)}
                  className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-white appearance-none outline-none focus:border-[#ff0f0f]/50 transition-colors font-mono text-sm"
                >
                  {versions.length > 0 ? (
                    versions.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))
                  ) : (
                    <option value="latest">latest</option>
                  )}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                  ▼
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#121317] border border-white/5 rounded-xl p-4 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                <div className="text-sm">
                   <p className="font-bold text-white mb-0.5">Server must be stopped</p>
                   <p className="text-white/50">You can only change the software or version when the server is completely offline.</p>
                </div>
             </div>
          </div>
          
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSave}
              disabled={loading || server.status === 'online'}
              className="flex items-center gap-2 bg-[#ff0f0f] hover:bg-[#cc0000] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_4px_15px_rgba(255,15,15,0.2)] disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? 'Rebuilding Container...' : 'Update & Rebuild'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
