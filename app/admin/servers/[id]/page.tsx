"use client";
import { useState, useEffect, use, useRef } from 'react';
import { Play, Square, RotateCcw, Terminal, Server as ServerIcon, Cpu, MemoryStick, HardDrive, Copy, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import io from 'socket.io-client';
import FileManager from '@/components/FileManager';
import ServerSettings from '@/components/ServerSettings';
import PluginManager from '@/components/PluginManager';
import ServerProperties from '@/components/ServerProperties';
import ModManager from '@/components/ModManager';
import StartupManager from '@/components/StartupManager';
import SubUsersManager from '@/components/SubUsersManager';
import ServerSFTP from '@/components/ServerSFTP';
import ClientEggSwitcher from '@/components/ClientEggSwitcher';
import MCVersionChanger from '@/components/MCVersionChanger';
import MCPlayerManager from '@/components/MCPlayerManager';
import MCLogsViewer from '@/components/MCLogsViewer';
import { confirmDialog } from '@/components/NovaConfirmModal';

export default function ServerManagementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [server, setServer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    "nova_daemon: Starting virtual terminal...",
    "nova_daemon: Authenticated successfully.",
    "nova_daemon: Connecting to daemon instance..."
  ]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);
  const [liveStats, setLiveStats] = useState<any>({ cpu: 0, ram: 0, disk: 0, limitRam: 1024, limitCpu: 100, limitDisk: 10240, uptimeMs: 0, netRxMB: 0, netTxMB: 0 });

  useEffect(() => {
    fetchServer();

    // Init socket
    const socket = io();
    socketRef.current = socket;

    socket.emit('joinServer', id);

    socket.on('log', (msg: string) => {
      setLogs(prev => {
        const newLogs = [...prev, ...msg.split('\n').filter(l => l.trim().length > 0)];
        if (newLogs.length > 500) return newLogs.slice(newLogs.length - 500);
        return newLogs;
      });
    });

    // Poll live stats every 5 seconds
    const statsInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/servers/${id}/stats`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setLiveStats(data);
        }
      } catch(e) {}
    }, 5000);

    return () => {
      socket.emit('leaveServer', id);
      socket.disconnect();
      clearInterval(statsInterval);
    };
  }, []);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs]);

  const fetchServer = async () => {
    try {
      const res = await fetch(`/api/admin/servers/${id}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setServer(data.server);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePowerAction = async (action: 'start' | 'stop' | 'restart' | 'suspend' | 'unsuspend') => {
    if (actionLoading || !server) return;
    setActionLoading(true);
    
    setLogs(prev => [...prev, `[nova] -> Executing power action: ${action}...`]);
    
    try {
      const res = await fetch(`/api/admin/servers/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      
      if (data.success) {
        setServer((prev: any) => ({ ...prev, status: data.status }));
      } else {
        alert(data.error || "Power action failed");
      }
    } catch (err) {
      console.error(err);
      setLogs(prev => [...prev, "Error executing power action."]);
    } finally {
      setActionLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'console' | 'files' | 'settings' | 'backups' | 'plugins' | 'properties' | 'mods' | 'startup' | 'subusers' | 'sftp' | 'eggchanger'>('console');

  if (loading) {
    return <div className="text-white/50 animate-pulse text-center p-10">Loading server data...</div>;
  }

  if (!server) {
    return <div className="text-red-400 text-center p-10">Server not found.</div>;
  }

  const handleUpdate = () => {
    // Re-fetch server data after settings are saved
    fetch(`/api/admin/servers/${server.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setServer(data.server);
        }
      });
  };

  const isMinecraft = server?.type === 'PAPER' || server?.type === 'VANILLA' || server?.type === 'PURPUR' || server?.type === 'FORGE' || server?.type === 'FABRIC' || server?.docker_image?.includes('java') || server?.docker_image?.includes('itzg');

  return (
    <div className="space-y-6 relative z-10 max-w-7xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-xl ${server.status === 'online' ? 'bg-[#10b981]/20 text-[#10b981] shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-red-500/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]'}`}>
            <ServerIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{server.name}</h2>
            <p className="text-sm text-white/50 font-mono mt-1">{server.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-xl border border-white/10">
          <div className="text-sm">
            <p className="text-white/40 uppercase font-bold text-[10px] tracking-wider mb-1">Status</p>
            <p className={`font-black uppercase tracking-wide ${server.status === 'online' ? 'text-[#10b981]' : 'text-red-500'}`}>{server.status}</p>
          </div>
          <div className="w-px h-10 bg-white/10 mx-2"></div>
          <div className="text-sm">
            <p className="text-white/40 uppercase font-bold text-[10px] tracking-wider mb-1">Node</p>
            <p className="font-bold text-white">{server.node}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Vertical Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 bg-[#0a0a0f]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 h-fit shadow-xl">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 px-2">Navigation</p>
          
          <button 
            onClick={() => setActiveTab('console')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'console' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Console
          </button>
          <button 
            onClick={() => setActiveTab('files')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'files' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            File Manager
          </button>
          <button 
            onClick={() => setActiveTab('backups')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'backups' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Backups
          </button>

          {isMinecraft && (
            <>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-4 mb-2 px-2">Minecraft Features</p>
              <button 
                onClick={() => setActiveTab('settings')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                Settings
              </button>
              <button 
                onClick={() => setActiveTab('plugins')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'plugins' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                Plugins
              </button>
              <button 
                onClick={() => setActiveTab('properties')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'properties' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                Properties
              </button>
              <button 
                onClick={() => setActiveTab('mods')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'mods' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                Mods
              </button>
              <button 
                onClick={() => setActiveTab('version')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'version' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                Version Changer
              </button>
              <button 
                onClick={() => setActiveTab('players')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'players' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                Player Manager
              </button>
              <button 
                onClick={() => setActiveTab('mclogs')}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'mclogs' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
              >
                MC Logs
              </button>
            </>
          )}
          
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-4 mb-2 px-2">Management</p>
          <button 
            onClick={() => setActiveTab('startup')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'startup' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Startup
          </button>
          <button 
            onClick={() => setActiveTab('subusers')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'subusers' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('sftp')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'sftp' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            SFTP
          </button>
          <button 
            onClick={() => setActiveTab('eggchanger')}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${activeTab === 'eggchanger' ? 'bg-[#ff0f0f]/20 text-[#ff0f0f] border border-[#ff0f0f]/30 shadow-[0_0_15px_rgba(255,15,15,0.2)]' : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'}`}
          >
            Egg Changer
          </button>
        </div>

        <div className="flex-1 grid lg:grid-cols-3 gap-6">
        
        {/* Main Section (Span 2) */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'console' ? (
            <div className="bg-[#050508] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-[#121317] border-b border-white/5 px-4 py-3 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#ff0f0f]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Server Console</span>
              </div>
              <div 
                ref={terminalRef}
                className="flex-1 p-4 overflow-y-auto font-mono text-[13px] text-gray-300 leading-relaxed bg-[#050508] custom-scrollbar"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
              >
                {logs.map((log, i) => (
                  <div key={i} className="hover:bg-white/[0.02] px-2 py-0.5 rounded transition-colors break-all">
                    <span className="text-[#a1a1aa] select-none mr-3">{'>'}</span>
                    {log.includes('Started') || log.includes('online') || log.includes('successfully') ? (
                      <span className="text-[#10b981]">{log}</span>
                    ) : log.includes('Error') || log.includes('offline') || log.includes('UNAUTHORIZED') ? (
                      <span className="text-red-400">{log}</span>
                    ) : log.includes('nova_daemon') || log.includes('[NOVA]') ? (
                      <span className="text-[#ff0f0f]">{log}</span>
                    ) : (
                      <span>{log}</span>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-3 bg-[#121317] border-t border-white/5">
                <div className="flex items-center bg-black/50 border border-white/5 rounded-lg px-3 py-2">
                  <span className="text-[#ff0f0f] mr-2 font-black">$</span>
                  <input 
                    type="text" 
                    placeholder="Type a command..." 
                    className="bg-transparent w-full outline-none text-sm font-mono text-white placeholder:text-white/20"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        const val = e.currentTarget.value;
                        e.currentTarget.value = '';
                        try {
                          await fetch(`/api/admin/servers/${id}/command`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ command: val })
                          });
                        } catch(err) {
                          setLogs(prev => [...prev, `[error] Failed to send command`]);
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : activeTab === 'files' ? (
            <FileManager serverId={server.id} />
          ) : activeTab === 'backups' ? (
            <ServerBackups serverId={server.id} />
          ) : activeTab === 'plugins' ? (
            <PluginManager serverId={server.id} />
          ) : activeTab === 'properties' ? (
            <ServerProperties serverId={server.id} />
          ) : activeTab === 'mods' ? (
            <ModManager serverId={server.id} />
          ) : activeTab === 'version' ? (
            <MCVersionChanger serverId={server.id} />
          ) : activeTab === 'players' ? (
            <MCPlayerManager serverId={server.id} allocation={server.allocation} isAdmin={true} />
          ) : activeTab === 'mclogs' ? (
            <MCLogsViewer serverId={server.id} />
          ) : activeTab === 'startup' ? (
            <StartupManager server={server} />
          ) : activeTab === 'subusers' ? (
            <SubUsersManager serverId={server.id} />
          ) : activeTab === 'sftp' ? (
            <ServerSFTP server={server} />
          ) : activeTab === 'eggchanger' ? (
            <ClientEggSwitcher server={server} onUpdate={handleUpdate} />
          ) : (
            <ServerSettings server={server} onUpdate={handleUpdate} />
          )}
        </div>

        {/* Sidebar Actions & Stats */}
        <div className="space-y-6">
          
          {/* Power Controls */}
          <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl">
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">Power Controls</h3>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handlePowerAction('start')}
                disabled={actionLoading || server.status === 'online'}
                className="flex flex-col items-center justify-center gap-2 bg-[#10b981]/10 hover:bg-[#10b981]/20 disabled:opacity-50 disabled:hover:bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] p-4 rounded-xl transition-all cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                <span className="text-xs font-bold uppercase tracking-wide">Start</span>
              </button>
              
              <button 
                onClick={() => handlePowerAction('restart')}
                disabled={actionLoading || server.status === 'offline'}
                className="flex flex-col items-center justify-center gap-2 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 disabled:opacity-50 disabled:hover:bg-[#3b82f6]/10 border border-[#3b82f6]/20 text-[#3b82f6] p-4 rounded-xl transition-all cursor-pointer"
              >
                <RotateCcw className="w-6 h-6" />
                <span className="text-xs font-bold uppercase tracking-wide">Restart</span>
              </button>
              
              <button 
                onClick={() => handlePowerAction('stop')}
                disabled={actionLoading || server.status === 'offline'}
                className="col-span-2 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:hover:bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl transition-all cursor-pointer"
              >
                <Square className="w-5 h-5 fill-current" />
                <span className="text-xs font-bold uppercase tracking-wide">Force Stop</span>
              </button>

              <button 
                onClick={() => handlePowerAction(server.status === 'suspended' ? 'unsuspend' : 'suspend')}
                disabled={actionLoading}
                className={`col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl transition-all cursor-pointer font-bold mt-1 border ${
                  server.status === 'suspended' 
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-400' 
                    : 'bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/20 text-orange-400'
                }`}
              >
                <span className="text-xs uppercase tracking-wide">
                  {server.status === 'suspended' ? 'Unsuspend Server' : 'Suspend Server'}
                </span>
              </button>

              <button 
                onClick={async () => {
                  if (await confirmDialog("Are you sure you want to permanently delete this server and all its files? This action cannot be undone.", "Delete Server", "danger")) {
                    setActionLoading(true);
                    try {
                      const res = await fetch(`/api/admin/servers/${id}`, { method: 'DELETE' });
                      const data = await res.json();
                      if (data.success) {
                        window.location.href = '/admin/servers';
                      } else {
                        alert(data.error || "Failed to delete server");
                      }
                    } catch(e) {
                      alert("Error deleting server");
                    } finally {
                      setActionLoading(false);
                    }
                  }
                }}
                disabled={actionLoading}
                className="col-span-2 flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 hover:text-red-300 p-3 rounded-xl transition-all cursor-pointer font-black mt-2"
              >
                <span className="text-xs uppercase tracking-wide">Delete Server</span>
              </button>
            </div>
          </div>

          {/* Live Stats */}
          {server.status === 'online' && (
            <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-4">
              <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">Live Statistics</h3>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1.5"><Cpu className="w-3 h-3 text-[#10b981]"/> CPU</p>
                  <span className="text-xs font-bold text-[#10b981]">{liveStats.cpu.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#10b981] to-[#34d399] rounded-full transition-all duration-500" style={{ width: `${Math.min(liveStats.cpu, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1.5"><MemoryStick className="w-3 h-3 text-[#3b82f6]"/> RAM</p>
                  <span className="text-xs font-bold text-[#3b82f6]">{liveStats.ram.toFixed(0)} / {liveStats.limitRam} MB</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] rounded-full transition-all duration-500" style={{ width: `${Math.min((liveStats.ram / liveStats.limitRam) * 100, 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider flex items-center gap-1.5"><HardDrive className="w-3 h-3 text-[#f59e0b]"/> Disk</p>
                  <span className="text-xs font-bold text-[#f59e0b]">{liveStats.disk.toFixed(1)} GB</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] rounded-full transition-all duration-500" style={{ width: `${Math.min((liveStats.disk / (liveStats.limitDisk / 1024)) * 100, 100)}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/5">
                <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-white/40 uppercase font-bold">Uptime</p>
                    <p className="text-xs font-black text-purple-300 font-mono truncate">
                      {(() => {
                        const ms = (liveStats as any).uptimeMs || 0;
                        if (ms <= 0) return "0m 0s";
                        const sec = Math.floor((ms / 1000) % 60);
                        const min = Math.floor((ms / (1000 * 60)) % 60);
                        const hr = Math.floor((ms / (1000 * 60 * 60)) % 24);
                        const d = Math.floor(ms / (1000 * 60 * 60 * 24));
                        let str = "";
                        if (d > 0) str += `${d}d `;
                        if (hr > 0 || d > 0) str += `${hr}h `;
                        str += `${min}m`;
                        return str;
                      })()}
                    </p>
                  </div>
                </div>
                
                <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-white/40 uppercase font-bold">Net Inbound</p>
                    <p className="text-xs font-black text-cyan-300 font-mono truncate">
                      {((liveStats as any).netRxMB || 0).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5">
                  <div className="p-2 bg-rose-500/10 rounded-lg text-rose-400">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] text-white/40 uppercase font-bold">Net Outbound</p>
                    <p className="text-xs font-black text-rose-300 font-mono truncate">
                      {((liveStats as any).netTxMB || 0).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Allocation & Resources */}
          <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-xl space-y-5">
            <h3 className="text-xs font-black text-white/50 uppercase tracking-widest mb-4">Network & Resources</h3>
            
            <div>
              <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1.5">Primary Allocation</p>
              <div className="bg-black/50 border border-white/10 rounded-lg p-3 flex items-center justify-between">
                <span className="font-mono text-sm text-blue-400">{server.allocation}</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(server.allocation)}
                  className="text-white/40 hover:text-white cursor-pointer bg-transparent border-none"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><MemoryStick className="w-3 h-3"/> Memory</p>
                <p className="font-bold text-white text-lg">{server.limits.memory} <span className="text-sm text-white/50">MB</span></p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><Cpu className="w-3 h-3"/> CPU limit</p>
                <p className="font-bold text-white text-lg">{server.limits.cpu} <span className="text-sm text-white/50">%</span></p>
              </div>
              <div>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5"><HardDrive className="w-3 h-3"/> Disk space</p>
                <p className="font-bold text-white text-lg">{server.limits.disk} <span className="text-sm text-white/50">MB</span></p>
              </div>
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
}
