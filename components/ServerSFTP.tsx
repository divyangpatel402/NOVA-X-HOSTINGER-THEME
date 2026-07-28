"use client";
import React, { useState, useEffect } from "react";
import { Network, Copy, Check, Key, RefreshCw, Eye, EyeOff, AlertTriangle, Lock } from "lucide-react";
import { confirmDialog } from "@/components/NovaConfirmModal";

export default function ServerSFTP({ server }: { server: any }) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  
  const [sftpInfo, setSftpInfo] = useState({
    host: "127.0.0.1",
    port: 2022,
    username: `${server?.id || 'server'}_admin`,
    password: "••••••••••••••••"
  });

  useEffect(() => {
    if (server?.id) {
      fetchSftpInfo();
    }
  }, [server?.id]);

  const fetchSftpInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/servers/${server.id}/sftp`);
      if (res.ok) {
        const data = await res.json();
        setSftpInfo(data);
      }
    } catch (e) {
      console.error("Error fetching SFTP info:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!await confirmDialog("Are you sure you want to reset the SFTP password? Existing connections will be terminated.", "Reset SFTP Password", "warning")) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/admin/servers/${server.id}/sftp`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setSftpInfo(prev => ({ ...prev, username: data.username, password: data.password }));
        setShowPassword(true);
        alert("SFTP Password reset successfully!");
      } else {
        alert("Failed to reset password.");
      }
    } catch (e) {
      alert("Error resetting password.");
    } finally {
      setResetting(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Network className="w-6 h-6 text-[#ff0f0f]" />
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">SFTP Details</h2>
            <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">Connect via FTP client</p>
          </div>
        </div>
        <button
          onClick={handleResetPassword}
          disabled={resetting || loading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
          Reset Password
        </button>
      </div>

      <div className="bg-[#050508] border border-white/5 p-6 rounded-2xl shadow-xl relative overflow-hidden group hover:border-white/10 transition-colors animate-in fade-in zoom-in-95">
        <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
          <Key className="w-5 h-5 text-[#ff0f0f]" /> Connection Info
        </h3>
        
        {loading ? (
          <div className="py-12 flex justify-center items-center text-white/40 gap-3">
            <RefreshCw className="w-5 h-5 animate-spin text-[#ff0f0f]" />
            <span>Loading SFTP credentials...</span>
          </div>
        ) : (
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Host Address (Node FQDN / IP)</label>
              <div className="flex">
                <div className="flex-1 bg-black/40 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 font-mono text-sm text-[#00ff66] font-bold">
                  {sftpInfo.host}
                </div>
                <button 
                  onClick={() => handleCopy(sftpInfo.host, 'host')}
                  className="px-4 bg-white/5 border border-white/10 rounded-r-xl hover:bg-white/10 transition-colors flex items-center justify-center text-white/50 hover:text-white"
                >
                  {copiedField === 'host' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Port</label>
              <div className="flex">
                <div className="flex-1 bg-black/40 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 font-mono text-sm text-white">
                  {sftpInfo.port}
                </div>
                <button 
                  onClick={() => handleCopy(sftpInfo.port.toString(), 'port')}
                  className="px-4 bg-white/5 border border-white/10 rounded-r-xl hover:bg-white/10 transition-colors flex items-center justify-center text-white/50 hover:text-white"
                >
                  {copiedField === 'port' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Username</label>
              <div className="flex">
                <div className="flex-1 bg-black/40 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 font-mono text-sm text-white truncate">
                  {sftpInfo.username}
                </div>
                <button 
                  onClick={() => handleCopy(sftpInfo.username, 'username')}
                  className="px-4 bg-white/5 border border-white/10 rounded-r-xl hover:bg-white/10 transition-colors flex items-center justify-center text-white/50 hover:text-white"
                >
                  {copiedField === 'username' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Password</label>
              <div className="flex">
                <div className="flex-1 bg-black/40 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 font-mono text-sm text-white font-bold">
                  {showPassword ? sftpInfo.password : "••••••••••••••••"}
                </div>
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 bg-white/5 border border-white/10 border-r-0 hover:bg-white/10 transition-colors flex items-center justify-center text-white/50 hover:text-white"
                  title="Toggle Password Visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => handleCopy(sftpInfo.password, 'password')}
                  className="px-3 bg-white/5 border border-white/10 border-r-0 hover:bg-white/10 transition-colors flex items-center justify-center text-white/50 hover:text-white"
                  title="Copy Password"
                >
                  {copiedField === 'password' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleResetPassword}
                  disabled={resetting || loading}
                  className="px-4 bg-[#ff0f0f]/20 hover:bg-[#ff0f0f]/30 text-[#ff0f0f] border border-[#ff0f0f]/40 rounded-r-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  title="Generate New Password"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
                  <span>Reset Pass</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl p-6 flex items-start gap-4 justify-between">
         <div className="flex gap-4">
           <Network className="w-6 h-6 text-[#10b981] shrink-0" />
           <div>
              <h4 className="font-bold text-[#10b981] uppercase tracking-wider text-sm mb-1">SFTP Connection Active</h4>
              <p className="text-white/60 text-xs leading-relaxed max-w-2xl">
                Use an SFTP client like FileZilla or WinSCP to connect to your server's file system remotely. Ensure you use port <strong>2022</strong> and the exact credentials provided above.
              </p>
           </div>
         </div>
         <a 
           href={`sftp://${sftpInfo.username}:${sftpInfo.password}@${sftpInfo.host}:${sftpInfo.port}/`}
           className="px-6 py-3 bg-[#10b981] hover:bg-[#10b981]/80 text-black font-bold rounded-xl uppercase tracking-wider text-xs transition-all flex items-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
         >
           Launch WinSCP
         </a>
      </div>
    </div>
  );
}
