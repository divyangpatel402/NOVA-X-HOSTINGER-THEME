"use client";
import React, { useState, useEffect } from "react";
import { TerminalSquare, Save, AlertTriangle, RefreshCw, Box, Cpu } from "lucide-react";

export default function StartupManager({ server }: { server: any }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const mem = server?.limits?.memory || 1024;
  const cpu = server?.limits?.cpu || 100;
  const disk = server?.limits?.disk || 10240;
  
  const [startupCommand, setStartupCommand] = useState(server?.startup_command || '');
  const [dockerImage, setDockerImage] = useState(server?.docker_image || '');
  
  // Initialize with defaults if empty
  const defaultEnv = { ...(server?.environment || {}) };
  if (dockerImage.includes('node')) {
    if (!defaultEnv['MAIN_FILE']) defaultEnv['MAIN_FILE'] = 'index.js';
  } else if (dockerImage.includes('python')) {
    if (!defaultEnv['MAIN_FILE']) defaultEnv['MAIN_FILE'] = 'main.py';
    if (!defaultEnv['REQUIREMENTS_FILE']) defaultEnv['REQUIREMENTS_FILE'] = 'requirements.txt';
  } else if (dockerImage.includes('java') || dockerImage.includes('minecraft')) {
    if (!defaultEnv['SERVER_JARFILE']) defaultEnv['SERVER_JARFILE'] = 'server.jar';
  }
  
  const [environment, setEnvironment] = useState<Record<string, string>>(defaultEnv);

  // Determine which variables to show based on the docker image
  const isNode = dockerImage.includes('node');
  const isPython = dockerImage.includes('python');
  const isJava = dockerImage.includes('java') || dockerImage.includes('minecraft');

  const getCompatibleImages = () => {
    if (isNode || server?.nest === 'Node.js' || server?.type === 'NODEJS') {
      return [
        { label: 'Node.js 22 (Latest)', value: 'ghcr.io/pterodactyl/yolks:nodejs_22' },
        { label: 'Node.js 20 (Recommended LTS)', value: 'ghcr.io/pterodactyl/yolks:nodejs_20' },
        { label: 'Node.js 19', value: 'ghcr.io/pterodactyl/yolks:nodejs_19' },
        { label: 'Node.js 18 (LTS)', value: 'ghcr.io/pterodactyl/yolks:nodejs_18' },
        { label: 'Node.js 16 (Legacy)', value: 'ghcr.io/pterodactyl/yolks:nodejs_16' },
        { label: 'Node.js 14', value: 'ghcr.io/pterodactyl/yolks:nodejs_14' },
      ];
    } else if (isPython || server?.nest === 'Python' || server?.type === 'PYTHON') {
      return [
        { label: 'Python 3.12 (Latest)', value: 'ghcr.io/pterodactyl/yolks:python_3.12' },
        { label: 'Python 3.11 (Recommended)', value: 'ghcr.io/pterodactyl/yolks:python_3.11' },
        { label: 'Python 3.10', value: 'ghcr.io/pterodactyl/yolks:python_3.10' },
        { label: 'Python 3.9', value: 'ghcr.io/pterodactyl/yolks:python_3.9' },
        { label: 'Python 3.8', value: 'ghcr.io/pterodactyl/yolks:python_3.8' },
      ];
    } else {
      return [
        { label: 'Java 25 (Latest JDK)', value: 'ghcr.io/pterodactyl/yolks:java_25' },
        { label: 'Java 21 (Minecraft 1.20.5+ Recommended)', value: 'ghcr.io/pterodactyl/yolks:java_21' },
        { label: 'Java 17 (Minecraft 1.18 - 1.20.4)', value: 'ghcr.io/pterodactyl/yolks:java_17' },
        { label: 'Java 16 (Minecraft 1.17)', value: 'ghcr.io/pterodactyl/yolks:java_16' },
        { label: 'Java 11 (Minecraft 1.12 - 1.16)', value: 'ghcr.io/pterodactyl/yolks:java_11' },
        { label: 'Java 8 (Minecraft 1.8 - 1.12)', value: 'ghcr.io/pterodactyl/yolks:java_8' },
        { label: 'ITZG Minecraft Server (Auto-download Vanilla/Paper/Forge)', value: 'itzg/minecraft-server' },
        { label: 'ITZG BungeeCord / Velocity Proxy', value: 'itzg/bungeecord' },
      ];
    }
  };

  const handleEnvChange = (key: string, value: string) => {
    setEnvironment(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const payload = {
        startup_command: startupCommand,
        docker_image: dockerImage,
        environment
      };

      const res = await fetch(`/api/admin/servers/${server.id}/startup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error("Failed to save startup configuration.");
      
      setSuccess('Startup configuration saved! The new command and variables will be used on the next boot.');
    } catch (e: any) {
      setError(e.message || "Failed to save startup configuration.");
    } finally {
      setLoading(false);
    }
  };

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
          <TerminalSquare className="w-6 h-6 text-[#ff0f0f]" />
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Startup Configuration</h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">Manage boot parameters and variables</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2.5 bg-[#ff0f0f] hover:bg-[#ff0f0f]/80 text-white font-bold rounded-xl uppercase tracking-wider text-sm transition-all flex items-center disabled:opacity-50 shadow-[0_0_20px_rgba(255,15,15,0.3)] hover:shadow-[0_0_25px_rgba(255,15,15,0.5)]"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#050508] border border-white/5 p-6 rounded-2xl shadow-xl col-span-1 md:col-span-2">
          <label className="text-xs font-black text-white/70 uppercase tracking-widest mb-3 block">Startup Command</label>
          <div className="flex rounded-xl overflow-hidden border border-white/10 focus-within:border-[#ff0f0f] transition-colors">
            <div className="bg-white/5 px-4 flex items-center justify-center border-r border-white/10">
              <TerminalSquare className="w-4 h-4 text-white/40" />
            </div>
            <input 
              type="text" 
              value={startupCommand}
              onChange={(e) => setStartupCommand(e.target.value)}
              className="w-full bg-black/40 px-4 py-3 text-sm font-mono text-white outline-none"
              placeholder={isJava ? "java -Xms128M -Xmx1024M -jar server.jar" : "if [[ -d .git ]] ..."}
            />
          </div>
        </div>

        <div className="bg-[#050508] border border-white/5 p-6 rounded-2xl shadow-xl col-span-1 md:col-span-2 space-y-3">
          <label className="text-xs font-black text-white/70 uppercase tracking-widest block">Docker Image & Runtime Version</label>
          <select 
            value={dockerImage} 
            onChange={e => setDockerImage(e.target.value)} 
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f] font-mono transition-colors"
          >
            {getCompatibleImages().map(img => (
              <option key={img.value} value={img.value}>{img.label} — [{img.value}]</option>
            ))}
            {!getCompatibleImages().some(img => img.value === dockerImage) && dockerImage && (
              <option value={dockerImage}>Custom Image: {dockerImage}</option>
            )}
          </select>
          <input 
            type="text" 
            value={dockerImage}
            onChange={(e) => setDockerImage(e.target.value)}
            className="w-full bg-black/20 border border-white/5 px-4 py-2 text-xs font-mono text-white/80 rounded-xl outline-none focus:border-[#ff0f0f]/50 transition-colors"
            placeholder="Or type custom Docker image URL (e.g. ghcr.io/pterodactyl/yolks:nodejs_20)..."
          />
          <p className="text-[10px] text-white/30 mt-1 font-mono uppercase tracking-wider">
            Select the exact runtime version (e.g. Node 22, Node 20, Java 21, Java 17) required for this server or override manually.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-white mb-4">Variables</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isJava && (
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Server Jar File</label>
              <input 
                type="text" 
                value={environment['SERVER_JARFILE'] || 'server.jar'}
                onChange={e => handleEnvChange('SERVER_JARFILE', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" 
              />
              <p className="text-[10px] text-white/30 mt-2">The name of the server jarfile.</p>
            </div>
          )}

          {(isNode || isPython) && (
            <>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">Git Repo Address</label>
                <input 
                  type="text" 
                  value={environment['GIT_REPO_ADDRESS'] || ''}
                  onChange={e => handleEnvChange('GIT_REPO_ADDRESS', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" 
                  placeholder="https://github.com/user/repo"
                />
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">Git Branch</label>
                <input 
                  type="text" 
                  value={environment['GIT_BRANCH'] || ''}
                  onChange={e => handleEnvChange('GIT_BRANCH', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" 
                  placeholder="main"
                />
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-white/60 uppercase mb-1">Auto Update</label>
                  <p className="text-[10px] text-white/40">Pull latest files on startup.</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={environment['AUTO_UPDATE'] === '1'}
                  onChange={e => handleEnvChange('AUTO_UPDATE', e.target.checked ? '1' : '0')}
                  className="w-5 h-5"
                />
              </div>
            </>
          )}

          {isNode && (
            <>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">Main File</label>
                <input 
                  type="text" 
                  value={environment['MAIN_FILE'] || 'index.js'}
                  onChange={e => handleEnvChange('MAIN_FILE', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" 
                />
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">Node Packages</label>
                <input 
                  type="text" 
                  value={environment['NODE_PACKAGES'] || ''}
                  onChange={e => handleEnvChange('NODE_PACKAGES', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" 
                />
              </div>
            </>
          )}

          {isPython && (
            <>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">App Py File</label>
                <input 
                  type="text" 
                  value={environment['MAIN_FILE'] || 'main.py'}
                  onChange={e => handleEnvChange('MAIN_FILE', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" 
                />
              </div>
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl">
                <label className="block text-xs font-bold text-white/60 uppercase mb-2">Requirements File</label>
                <input 
                  type="text" 
                  value={environment['REQUIREMENTS_FILE'] || 'requirements.txt'}
                  onChange={e => handleEnvChange('REQUIREMENTS_FILE', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" 
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="bg-[#050508] border border-white/5 p-5 rounded-2xl shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
          <label className="text-xs font-black text-white/70 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#ff0f0f]" /> Server Memory
          </label>
          <input 
            type="text" 
            readOnly
            value={`${mem} MB`}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white/50 outline-none cursor-not-allowed"
          />
          <p className="text-[10px] text-white/30 mt-3 font-mono uppercase tracking-wider">Assigned via plan</p>
        </div>
        
        <div className="bg-[#050508] border border-white/5 p-5 rounded-2xl shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
          <label className="text-xs font-black text-white/70 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#3b82f6]" /> CPU Limit
          </label>
          <input 
            type="text" 
            readOnly
            value={`${cpu}%`}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white/50 outline-none cursor-not-allowed"
          />
          <p className="text-[10px] text-white/30 mt-3 font-mono uppercase tracking-wider">Assigned via plan</p>
        </div>
        
        <div className="bg-[#050508] border border-white/5 p-5 rounded-2xl shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors">
          <label className="text-xs font-black text-white/70 uppercase tracking-widest mb-3 block flex items-center gap-2">
            <Box className="w-4 h-4 text-emerald-400" /> Disk Space
          </label>
          <input 
            type="text" 
            readOnly
            value={`${disk} MB`}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-white/50 outline-none cursor-not-allowed"
          />
          <p className="text-[10px] text-white/30 mt-3 font-mono uppercase tracking-wider">Assigned via plan</p>
        </div>
      </div>
    </div>
  );
}
