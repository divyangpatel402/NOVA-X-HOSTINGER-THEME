"use client";
import { useState, useEffect, use } from 'react';
import { Trash2, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { confirmDialog } from '@/components/NovaConfirmModal';

export default function NodeAllocationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: nodeId } = use(params);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [ip, setIp] = useState('0.0.0.0');
  const [alias, setAlias] = useState('');
  const [ports, setPorts] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const res = await fetch(`/api/admin/nodes/${nodeId}/allocations`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAllocations(data.allocations);
        setSelectedIds([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!ports) return alert("Ports are required");
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/nodes/${nodeId}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip, alias, ports })
      });
      
      if (res.ok) {
        setPorts('');
        fetchAllocations();
      } else {
        alert("Failed to assign allocations");
      }
    } catch (err) {
      alert("Error assigning allocations");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAll = () => {
    if (selectedIds.length === allocations.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allocations.map(a => a.id));
    }
  };

  const handleToggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleMassDeleteSelected = async () => {
    if (selectedIds.length === 0) return alert("No allocations selected.");
    if (!await confirmDialog(`Are you sure you want to delete ${selectedIds.length} selected allocation(s)?`, "Delete Allocations", "danger")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/nodes/${nodeId}/allocations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationIds: selectedIds })
      });
      if (res.ok) {
        fetchAllocations();
      } else {
        alert("Failed to delete selected allocations.");
      }
    } catch (err) {
      alert("Error deleting allocations.");
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAllUnassigned = async () => {
    const unassignedCount = allocations.filter(a => !a.assignedToServerId).length;
    if (unassignedCount === 0) return alert("No unassigned allocations to delete.");
    if (!await confirmDialog(`Are you sure you want to mass delete ALL ${unassignedCount} unassigned allocation(s)?`, "Delete Unassigned Allocations", "danger")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/nodes/${nodeId}/allocations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAllUnassigned: true })
      });
      if (res.ok) {
        fetchAllocations();
      } else {
        alert("Failed to delete unassigned allocations.");
      }
    } catch (err) {
      alert("Error deleting unassigned allocations.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Node Allocations</h2>
        
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleMassDeleteSelected}
              disabled={deleting}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected ({selectedIds.length})
            </button>
          )}
          <button
            onClick={handleDeleteAllUnassigned}
            disabled={deleting || allocations.filter(a => !a.assignedToServerId).length === 0}
            className="bg-amber-500/10 hover:bg-amber-500/20 disabled:opacity-50 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Delete All Unassigned
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left side: Assign New */}
        <div className="bg-[#242930] rounded-lg shadow-xl overflow-hidden border-t-2 border-green-500">
          <div className="p-4 bg-[#2f353e] border-b border-black/20">
            <h3 className="font-semibold text-white">Assign New Allocations</h3>
          </div>
          <div className="p-6 space-y-4 text-sm">
            <div>
              <label className="block font-bold text-white mb-1">IP Address</label>
              <div className="relative">
                <input value={ip} onChange={e => setIp(e.target.value)} type="text" className="w-full bg-[#1e2227] border border-black/40 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors font-mono text-xs" />
              </div>
              <p className="text-white/40 text-xs mt-1">Enter an IP address to assign ports to here.</p>
            </div>
            
            <div>
              <label className="block font-bold text-white mb-1">IP Alias</label>
              <input value={alias} onChange={e => setAlias(e.target.value)} type="text" placeholder="lavalink.novahostinger.site" className="w-full bg-[#1e2227] border border-black/40 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors text-xs" />
              <p className="text-white/40 text-xs mt-1">If you would like to assign a default alias to these allocations enter it here.</p>
            </div>
            
            <div>
              <label className="block font-bold text-white mb-1">Ports</label>
              <div className="relative">
                <input value={ports} onChange={e => setPorts(e.target.value)} type="text" placeholder="25565-2599 or 8080, 8081" className="w-full bg-[#1e2227] border border-black/40 rounded p-2 text-white outline-none focus:border-blue-500 transition-colors font-mono text-xs" />
              </div>
              <p className="text-white/40 text-xs mt-1">Enter individual ports or port ranges here separated by commas or spaces.</p>
            </div>
          </div>
          <div className="p-4 bg-[#2f353e] border-t border-black/20 flex justify-end">
            <button onClick={handleAssign} disabled={submitting} className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded font-bold text-sm transition-colors disabled:opacity-50 cursor-pointer">
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Right side: Existing */}
        <div className="lg:col-span-2 bg-[#242930] rounded-lg shadow-xl overflow-hidden border-t-2 border-blue-500">
          <div className="p-4 bg-[#2f353e] border-b border-black/20 flex items-center justify-between">
            <h3 className="font-semibold text-white">Existing Allocations ({allocations.length})</h3>
            <span className="text-xs text-white/50">{allocations.filter(a => a.assignedToServerId).length} Assigned, {allocations.filter(a => !a.assignedToServerId).length} Free</span>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1e2227] text-white font-bold border-b border-black/20 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input 
                      type="checkbox" 
                      checked={allocations.length > 0 && selectedIds.length === allocations.length}
                      onChange={handleToggleAll}
                      className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0 cursor-pointer" 
                    />
                  </th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">IP Alias</th>
                  <th className="p-3">Port</th>
                  <th className="p-3">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/20 text-white/80">
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
                ) : allocations.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center">No allocations found.</td></tr>
                ) : (
                  allocations.map((alloc) => {
                    const isSelected = selectedIds.includes(alloc.id);
                    return (
                      <tr key={alloc.id} className={`hover:bg-white/[0.02] ${isSelected ? 'bg-blue-500/10' : ''}`}>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => handleToggleOne(alloc.id)}
                            className="rounded bg-black/40 border-white/20 text-blue-500 focus:ring-0 cursor-pointer" 
                          />
                        </td>
                        <td className="p-3 font-mono text-xs">{alloc.ip}</td>
                        <td className="p-3">
                          <span className="bg-transparent text-white/50 text-xs font-mono">{alloc.alias || '-'}</span>
                        </td>
                        <td className="p-3 font-mono font-bold text-emerald-400">{alloc.port}</td>
                        <td className="p-3 text-blue-400 font-mono text-xs">
                          {alloc.assignedToServerId ? (
                            <span className="bg-blue-500/10 border border-blue-500/20 text-blue-300 px-2 py-0.5 rounded">Server #{alloc.assignedToServerId.slice(0, 8)}</span>
                          ) : (
                            <span className="text-white/30">Free</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
