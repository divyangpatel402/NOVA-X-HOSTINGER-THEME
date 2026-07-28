"use client";
import { useState, useEffect } from 'react';
import { Network, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { confirmDialog } from '@/components/NovaConfirmModal';

export default function NodesPage() {
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNodes();
  }, []);

  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/admin/nodes');
      const data = await res.json();
      if (data.success) {
        setNodes(data.nodes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNode = async (id: string, name: string) => {
    if (!await confirmDialog(`Are you sure you want to delete node "${name}"? This will also remove all its port allocations!`, "Delete Node", "danger")) return;
    try {
      const res = await fetch(`/api/admin/nodes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNodes(prev => prev.filter(n => n.id !== id));
      } else {
        alert("Failed to delete node.");
      }
    } catch (e) {
      alert("Error deleting node.");
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Nodes</h2>
        <Link href="/admin/nodes/create" className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> Create New
        </Link>
      </div>

      <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50 border-b border-white/5">
            <tr>
              <th className="p-4 font-semibold w-12"></th>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">FQDN</th>
              <th className="p-4 font-semibold">Memory</th>
              <th className="p-4 font-semibold">Disk</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="p-4 text-center text-white/50">Loading...</td></tr>
            ) : nodes.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-white/50">No nodes found. Create one to get started.</td></tr>
            ) : (
              nodes.map((node) => (
                <tr key={node.id} className="hover:bg-white/[0.02]">
                  <td className="p-4 text-center">
                    <div className={`w-3 h-3 rounded-full mx-auto ${node.status === 'online' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]'}`}></div>
                  </td>
                  <td className="p-4">
                    <div className="font-medium text-blue-400">{node.name}</div>
                    <div className="text-xs text-white/40 font-mono mt-0.5">{node.id}</div>
                  </td>
                  <td className="p-4 text-white/60 font-mono text-xs">{node.fqdn}</td>
                  <td className="p-4 text-white/60">{node.memory} MiB</td>
                  <td className="p-4 text-white/60">{node.disk} MiB</td>
                  <td className="p-4 text-right flex items-center justify-end gap-2">
                    <Link href={`/admin/nodes/${node.id}/allocations`} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors">
                      Allocations
                    </Link>
                    <button 
                      onClick={() => handleDeleteNode(node.id, node.name)}
                      className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Delete Node"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
