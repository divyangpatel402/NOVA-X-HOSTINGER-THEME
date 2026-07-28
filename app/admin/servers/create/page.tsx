"use client";
import { useState, useEffect } from 'react';

export default function CreateServerPage() {
  const [eggs, setEggs] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [nodeId, setNodeId] = useState('');
  const [allocationId, setAllocationId] = useState('');
  
  const [memory, setMemory] = useState(1024);
  const [swap, setSwap] = useState(0);
  const [disk, setDisk] = useState(10240);
  const [cpu, setCpu] = useState(100);
  
  const [selectedNest, setSelectedNest] = useState('Minecraft');
  const [selectedEggId, setSelectedEggId] = useState('');
  const [dockerImage, setDockerImage] = useState('ghcr.io/pterodactyl/yolks:java_17');
  const [startupCommand, setStartupCommand] = useState('java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [eggsRes, nodesRes, allocsRes, usersRes] = await Promise.all([
        fetch('/api/admin/eggs', { cache: 'no-store' }),
        fetch('/api/admin/nodes', { cache: 'no-store' }),
        fetch('/api/admin/allocations', { cache: 'no-store' }),
        fetch('/api/admin/users', { cache: 'no-store' })
      ]);
      const eggsData = await eggsRes.json();
      const nodesData = await nodesRes.json();
      const allocsData = await allocsRes.json();
      const usersData = await usersRes.json();
      
      if (eggsData.success && eggsData.eggs.length > 0) {
        setEggs(eggsData.eggs);
        const first = eggsData.eggs[0];
        setSelectedNest(first.nest);
        setSelectedEggId(first.id);
        setDockerImage(first.docker_image);
        setStartupCommand(first.startup_command);
      }
      
      if (nodesData.success && nodesData.nodes.length > 0) {
        setNodes(nodesData.nodes);
        setNodeId(nodesData.nodes[0].id);
      }
      
      if (allocsData.success) {
        setAllocations(allocsData.allocations.filter((a: any) => !a.assignedToServerId));
      }
      
      if (usersData.success && usersData.users.length > 0) {
        setUsers(usersData.users);
        setOwnerEmail(usersData.users[0].email);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // When egg selection changes, update image and startup
  const handleEggChange = (eggId: string) => {
    setSelectedEggId(eggId);
    const egg = eggs.find(e => e.id === eggId);
    if (egg) {
      setDockerImage(egg.docker_image);
      setStartupCommand(egg.startup_command);
    }
  };
  
  // Available allocations for selected node
  const availableAllocations = allocations.filter(a => a.nodeId === nodeId);

  const getCompatibleImages = (nest: string) => {
    if (nest === 'Node.js') {
      return [
        { label: 'Node.js 22 (Latest)', value: 'ghcr.io/pterodactyl/yolks:nodejs_22' },
        { label: 'Node.js 20 (Recommended LTS)', value: 'ghcr.io/pterodactyl/yolks:nodejs_20' },
        { label: 'Node.js 19', value: 'ghcr.io/pterodactyl/yolks:nodejs_19' },
        { label: 'Node.js 18 (LTS)', value: 'ghcr.io/pterodactyl/yolks:nodejs_18' },
        { label: 'Node.js 16 (Legacy)', value: 'ghcr.io/pterodactyl/yolks:nodejs_16' },
        { label: 'Node.js 14', value: 'ghcr.io/pterodactyl/yolks:nodejs_14' },
      ];
    } else if (nest === 'Python') {
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

  const handleCreate = async () => {
    if (!name || !ownerEmail) return alert("Name and Owner Email required");
    if (!nodeId || !allocationId) return alert("Node and Allocation required");
    
    setLoading(true);
    try {
      const selectedAlloc = allocations.find(a => a.id === allocationId);
      const allocationString = selectedAlloc ? `${selectedAlloc.ip}:${selectedAlloc.port}` : '';
      
      const payload = {
        name, ownerEmail, node: nodeId, allocation: allocationString, allocationId,
        eggId: selectedEggId, memory, swap, disk, cpu, 
        docker_image: dockerImage, startup_command: startupCommand,
        nest: selectedNest
      };
      
      const res = await fetch('/api/admin/servers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        alert("Server Created Successfully!");
        window.location.href = '/admin/servers';
      } else {
        alert("Failed to create server");
      }
    } catch (err) {
      alert("Error creating server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl relative z-10">
      <h2 className="text-2xl font-bold">Create New Server</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Core Details */}
        <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold border-b border-white/10 pb-2 mb-4">Core Details</h3>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Server Name</label>
            <input value={name} onChange={e => setName(e.target.value)} type="text" placeholder="My Server" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Server Owner</label>
            {users.length > 0 ? (
              <select value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors">
                <option value="">Select a user...</option>
                {users.map(u => (
                  <option key={u.id || u.email} value={u.email}>{u.name ? `${u.name} (${u.email})` : u.email}</option>
                ))}
              </select>
            ) : (
              <input value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)} type="email" placeholder="user@example.com" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 transition-colors" />
            )}
          </div>
        </div>

        {/* Allocation */}
        <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold border-b border-white/10 pb-2 mb-4">Allocation Management</h3>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Node</label>
            <select value={nodeId} onChange={e => setNodeId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50">
              {nodes.length === 0 ? <option value="">No nodes available</option> : null}
              {nodes.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-white/60 uppercase mb-2">Default Allocation (IP/Port)</label>
            <select value={allocationId} onChange={e => setAllocationId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50">
              <option value="">Select an allocation</option>
              {availableAllocations.map(a => (
                <option key={a.id} value={a.id}>{a.ip}:{a.port} {a.alias ? `(${a.alias})` : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Resource Management */}
        <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4 col-span-2">
          <h3 className="font-bold border-b border-white/10 pb-2 mb-4">Resource Management</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">CPU Limit (%)</label>
              <input value={cpu} onChange={e => setCpu(Number(e.target.value))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Memory (MiB)</label>
              <input value={memory} onChange={e => setMemory(Number(e.target.value))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Disk Space (MiB)</label>
              <input value={disk} onChange={e => setDisk(Number(e.target.value))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50" />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Swap (MiB)</label>
              <input value={swap} onChange={e => setSwap(Number(e.target.value))} type="number" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <input type="checkbox" className="w-4 h-4 rounded" />
            <label className="text-sm font-bold text-white/80">Enable OOM Killer</label>
          </div>
        </div>

        {/* Nest Configuration */}
        <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl p-6 space-y-4 col-span-2">
          <h3 className="font-bold border-b border-white/10 pb-2 mb-4">Nest Configuration</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Nest</label>
               <select 
                value={selectedNest} 
                onChange={e => {
                  const newNest = e.target.value;
                  setSelectedNest(newNest);
                  const availableEggs = eggs.filter(egg => egg.nest === newNest);
                  if (availableEggs.length > 0) {
                    setSelectedEggId(availableEggs[0].id);
                    setDockerImage(availableEggs[0].docker_image);
                    setStartupCommand(availableEggs[0].startup_command);
                  } else {
                    setSelectedEggId('');
                    const defaultImg = newNest === 'Node.js' ? 'ghcr.io/pterodactyl/yolks:nodejs_20' : (newNest === 'Python' ? 'ghcr.io/pterodactyl/yolks:python_3.11' : 'ghcr.io/pterodactyl/yolks:java_21');
                    setDockerImage(defaultImg);
                    setStartupCommand(newNest === 'Node.js' ? 'node index.js' : (newNest === 'Python' ? 'python main.py' : 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}'));
                  }
                }} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50"
              >
                <option value="Minecraft">Minecraft</option>
                <option value="Python">Python</option>
                <option value="Node.js">Node.js</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Egg</label>
              <select value={selectedEggId} onChange={e => handleEggChange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50">
                {eggs.length === 0 ? <option value="">No eggs uploaded</option> : null}
                {eggs.filter(e => e.nest === selectedNest || selectedNest === '').map(egg => (
                  <option key={egg.id} value={egg.id}>{egg.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-bold text-white/60 uppercase">Docker Image & Runtime Version</label>
              <select 
                value={dockerImage} 
                onChange={e => setDockerImage(e.target.value)} 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono"
              >
                {getCompatibleImages(selectedNest).map(img => (
                  <option key={img.value} value={img.value}>{img.label} — [{img.value}]</option>
                ))}
                {!getCompatibleImages(selectedNest).some(img => img.value === dockerImage) && dockerImage && (
                  <option value={dockerImage}>Custom Image: {dockerImage}</option>
                )}
              </select>
              <input 
                value={dockerImage} 
                onChange={e => setDockerImage(e.target.value)} 
                type="text" 
                placeholder="Or type custom Docker image URL (e.g. ghcr.io/pterodactyl/yolks:nodejs_20)..."
                className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-2 text-xs text-white/80 outline-none focus:border-[#ff0f0f]/30 font-mono" 
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-white/60 uppercase mb-2">Startup Command</label>
              <input value={startupCommand} onChange={e => setStartupCommand(e.target.value)} type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#ff0f0f]/50 font-mono" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pb-8">
        <button onClick={handleCreate} disabled={loading} className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-8 py-3 rounded-xl font-bold transition-all shadow-[0_4px_20px_rgba(255,15,15,0.3)] hover:shadow-[0_8px_30px_rgba(255,15,15,0.5)] disabled:opacity-50">
          {loading ? 'Creating...' : 'Create Server'}
        </button>
      </div>
    </div>
  );
}
