"use client";
import { useState, useEffect } from 'react';
import { Server, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function ServersPage() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch('/api/admin/servers');
      const data = await res.json();
      if (data.success) {
        setServers(data.servers);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Servers</h2>
        <Link href="/admin/servers/create" className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> Create Server
        </Link>
      </div>

      <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50 border-b border-white/5">
            <tr>
              <th className="p-4 font-semibold">ID / Name</th>
              <th className="p-4 font-semibold">Owner</th>
              <th className="p-4 font-semibold">Node</th>
              <th className="p-4 font-semibold">Allocation</th>
              <th className="p-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="p-4 text-center text-white/50">Loading...</td></tr>
            ) : servers.length === 0 ? (
              <tr><td colSpan={5} className="p-4 text-center text-white/50">No servers found. Create one to get started.</td></tr>
            ) : (
              servers.map((server) => (
                <tr key={server.id} className="hover:bg-white/[0.02]">
                  <td className="p-4">
                    <Link href={`/admin/servers/${server.id}`} className="font-medium text-blue-400 hover:underline">{server.name}</Link>
                    <div className="text-xs text-white/40 font-mono mt-0.5">{server.id}</div>
                  </td>
                  <td className="p-4 text-white/60">{server.ownerEmail}</td>
                  <td className="p-4 text-white/60">{server.node}</td>
                  <td className="p-4 font-mono text-xs text-white/80">{server.allocation}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${server.status === 'online' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {server.status?.toUpperCase() || 'OFFLINE'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
