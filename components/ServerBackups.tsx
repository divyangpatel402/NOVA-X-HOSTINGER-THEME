"use client";
import { useState, useEffect } from 'react';
import { Archive, Download, Trash2, RefreshCw, Plus, Clock, FileArchive, AlertTriangle } from 'lucide-react';
import { confirmDialog } from '@/components/NovaConfirmModal';

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

export default function ServerBackups({ serverId }: { serverId: string }) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBackups();
  }, [serverId]);

  const fetchBackups = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/admin/servers/${serverId}/backups`);
      if (!res.ok) throw new Error("Failed to fetch backups");
      const data = await res.json();
      setBackups(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch backups");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsCreating(true);
      setError('');
      const res = await fetch(`/api/admin/servers/${serverId}/backups`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("Failed to create backup");
      await fetchBackups();
    } catch (e: any) {
      setError(e.message || "Failed to create backup");
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!await confirmDialog("Are you sure you want to delete this backup?", "Delete Backup", "danger")) return;
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/backups/${filename}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error("Failed to delete backup");
      await fetchBackups();
    } catch (e: any) {
      setError(e.message || "Failed to delete backup");
    }
  };

  const handleDownload = async (filename: string) => {
    window.open(`/api/admin/servers/${serverId}/backups/${filename}`, '_blank');
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in-95">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-[#050508] border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-[#121317] border-b border-white/5 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Archive className="w-5 h-5 text-[#ff0f0f]" />
            <div>
              <h3 className="font-black text-white uppercase tracking-wider text-sm">Server Backups</h3>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Zip archives of your server</p>
            </div>
          </div>
          
          <button 
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="flex items-center gap-2 bg-[#ff0f0f] hover:bg-[#cc0000] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-[0_4px_15px_rgba(255,15,15,0.2)] disabled:opacity-50"
          >
            {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isCreating ? 'Zipping Files...' : 'Create Backup'}
          </button>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-12 flex justify-center">
              <RefreshCw className="w-6 h-6 text-[#ff0f0f] animate-spin" />
            </div>
          ) : backups.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <FileArchive className="w-12 h-12 text-white/10 mb-4" />
              <h4 className="text-white font-bold mb-1">No backups found</h4>
              <p className="text-white/40 text-sm">Create a backup to secure your server files.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {backups.map((backup) => (
                <div key={backup.filename} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-xl">
                      <Archive className="w-5 h-5 text-[#3b82f6]" />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-bold text-white">{backup.filename}</p>
                      <div className="flex items-center text-xs text-white/40 mt-1 gap-3">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(backup.createdAt).toLocaleString()}</span>
                        <span>•</span>
                        <span className="bg-white/10 px-2 py-0.5 rounded-full">{formatSize(backup.size)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <button 
                      onClick={() => handleDownload(backup.filename)}
                      className="flex-1 md:flex-none flex justify-center items-center px-4 py-2 bg-[#3b82f6]/10 hover:bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                    </button>
                    <button 
                      onClick={() => handleDelete(backup.filename)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
