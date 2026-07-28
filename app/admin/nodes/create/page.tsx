"use client";
import { useState } from 'react';

export default function CreateNodePage() {
  const [name, setName] = useState('');
  const [fqdn, setFqdn] = useState('');
  const [memory, setMemory] = useState(10240);
  const [disk, setDisk] = useState(50000);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !fqdn) return alert("Name and FQDN are required");
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, fqdn, memory, disk })
      });
      
      if (res.ok) {
        window.location.href = '/admin/nodes';
      } else {
        alert("Failed to create node");
      }
    } catch (err) {
      alert("Error creating node");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl relative z-10">
      <h2 className="text-2xl font-bold">Create New Node</h2>
      
      <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Name</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="Node 1" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">FQDN</label>
            <input value={fqdn} onChange={e => setFqdn(e.target.value)} type="text" placeholder="node1.example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Total Memory (MiB)</label>
            <input value={memory} onChange={e => setMemory(Number(e.target.value))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Total Disk (MiB)</label>
            <input value={disk} onChange={e => setDisk(Number(e.target.value))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors" />
          </div>
        </div>
        
        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button onClick={handleCreate} disabled={loading} className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(255,15,15,0.3)] hover:shadow-[0_8px_30px_rgba(255,15,15,0.5)] disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Node'}
          </button>
        </div>
      </div>
    </div>
  );
}
