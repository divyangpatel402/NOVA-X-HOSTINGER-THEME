"use client";
import React, { useEffect, useState } from "react"; 
import { Save, AlertTriangle, RefreshCw, ServerCog } from "lucide-react";

interface Properties {
  [key: string]: string;
}

const COMMON_PROPERTIES = [
  { key: 'online-mode', type: 'boolean', label: 'Online Mode (Premium)' },
  { key: 'pvp', type: 'boolean', label: 'Player vs Player (PvP)' },
  { key: 'hardcore', type: 'boolean', label: 'Hardcore' },
  { key: 'allow-flight', type: 'boolean', label: 'Allow Flight' },
  { key: 'enable-command-block', type: 'boolean', label: 'Enable Command Blocks' },
  { key: 'gamemode', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'], label: 'Game Mode' },
  { key: 'difficulty', type: 'select', options: ['peaceful', 'easy', 'normal', 'hard'], label: 'Difficulty' },
  { key: 'max-players', type: 'number', label: 'Max Players' },
  { key: 'motd', type: 'text', label: 'MOTD (Message of the Day)' },
  { key: 'view-distance', type: 'number', label: 'View Distance' }
];

export default function ServerProperties({ serverId }: { serverId: string }) {
  const [properties, setProperties] = useState<Properties>({});
  const [originalContent, setOriginalContent] = useState<string>("");
  const [exists, setExists] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/servers/${serverId}/files?path=server.properties`);
      const data = await res.json();
      
      if (res.ok && data.isFile) {
        setOriginalContent(data.content);
        const parsed = parseProperties(data.content);
        setProperties(parsed);
        setExists(true);
      } else {
        setExists(false);
      }
    } catch (e: any) {
      setExists(false);
      setError('Failed to load server.properties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [serverId]);

  const parseProperties = (content: string): Properties => {
    const lines = content.split('\n');
    const parsed: Properties = {};
    for (const line of lines) {
      if (line.startsWith('#') || !line.trim()) continue;
      const index = line.indexOf('=');
      if (index === -1) continue;
      const key = line.substring(0, index).trim();
      const value = line.substring(index + 1).trim();
      parsed[key] = value;
    }
    return parsed;
  };

  const serializeProperties = (currentProps: Properties, originalText: string): string => {
    const lines = originalText.split('\n');
    const updatedKeys = new Set<string>();
    
    // Update existing
    const updatedLines = lines.map(line => {
      if (line.startsWith('#') || !line.trim()) return line;
      const index = line.indexOf('=');
      if (index === -1) return line;
      const key = line.substring(0, index).trim();
      
      if (currentProps[key] !== undefined) {
        updatedKeys.add(key);
        return `${key}=${currentProps[key]}`;
      }
      return line;
    });

    // Add new ones that were not in original
    for (const [key, value] of Object.entries(currentProps)) {
      if (!updatedKeys.has(key)) {
        updatedLines.push(`${key}=${value}`);
      }
    }

    return updatedLines.join('\n');
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');
      const newContent = serializeProperties(properties, originalContent);
      
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          path: 'server.properties',
          content: newContent
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save properties');
      
      setOriginalContent(newContent);
      setSuccess('Properties saved successfully! Restart the server to apply changes.');
    } catch (e: any) {
      setError(e.message || 'Failed to save properties.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setProperties(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <RefreshCw className="w-6 h-6 text-[#ff0f0f] animate-spin" />
      </div>
    );
  }

  if (!exists) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#050508] border border-white/5 rounded-2xl animate-in fade-in zoom-in-95">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4 opacity-80" />
        <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">server.properties Not Found</h3>
        <p className="text-white/40 text-sm max-w-md">
          The property file does not exist yet. Please start the server at least once to generate the server.properties file.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
          <RefreshCw className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{success}</p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ServerCog className="w-6 h-6 text-[#ff0f0f]" />
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Properties</h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">Configure core server rules and settings</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[#ff0f0f] hover:bg-[#ff0f0f]/80 text-white font-bold rounded-xl uppercase tracking-wider text-sm transition-all flex items-center disabled:opacity-50 shadow-[0_0_20px_rgba(255,15,15,0.3)] hover:shadow-[0_0_25px_rgba(255,15,15,0.5)]"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {COMMON_PROPERTIES.map((prop) => (
          <div key={prop.key} className="bg-[#050508] border border-white/5 p-5 rounded-2xl shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-black text-white/70 uppercase tracking-widest">{prop.label}</label>
              {prop.type === 'boolean' && (
                <button
                  onClick={() => handleChange(prop.key, properties[prop.key] === 'true' ? 'false' : 'true')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none border ${
                      properties[prop.key] === 'true' ? 'bg-[#ff0f0f] border-[#ff0f0f]' : 'bg-white/5 border-white/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        properties[prop.key] === 'true' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            </div>
            
            {prop.type === 'select' && (
              <select
                value={properties[prop.key] || ''}
                onChange={(e) => handleChange(prop.key, e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#ff0f0f] rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none transition-colors appearance-none"
              >
                {prop.options?.map(opt => (
                  <option key={opt} value={opt} className="bg-[#050508]">{opt}</option>
                ))}
              </select>
            )}

            {prop.type === 'number' && (
              <input
                type="number"
                value={properties[prop.key] || ''}
                onChange={(e) => handleChange(prop.key, e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#ff0f0f] rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none transition-colors"
              />
            )}

            {prop.type === 'text' && (
              <input
                type="text"
                value={properties[prop.key] || ''}
                onChange={(e) => handleChange(prop.key, e.target.value)}
                className="w-full bg-black/40 border border-white/10 focus:border-[#ff0f0f] rounded-xl px-4 py-2.5 text-sm font-bold text-white outline-none transition-colors"
              />
            )}

            <p className="text-[10px] text-white/30 mt-3 font-mono uppercase tracking-wider">Key: {prop.key}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-black text-white uppercase tracking-wider mb-4 mt-8 flex items-center gap-2">
           <AlertTriangle className="w-5 h-5 text-yellow-500" /> Advanced Properties
        </h3>
        <div className="bg-[#050508] border border-white/5 rounded-2xl shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.keys(properties).filter(k => !COMMON_PROPERTIES.find(cp => cp.key === k)).map(key => (
              <div key={key} className="flex flex-col">
                <label className="text-[10px] text-white/50 mb-1.5 font-mono uppercase tracking-widest">{key}</label>
                <input
                  type="text"
                  value={properties[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full bg-black/40 border border-white/10 focus:border-[#ff0f0f] rounded-lg px-3 py-2 text-sm font-mono text-white outline-none transition-colors"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
