"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Terminal, FolderOpen, Database, Network, PlayCircle, Settings } from 'lucide-react';

export default function ServerDashboardLayout({ children, params }: { children: React.ReactNode, params: { id: string } }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('nova_client_user');
    if (!userStr) {
      router.push('/client');
      return;
    }
    setIsLoggedIn(true);
  }, [router]);

  if (!isLoggedIn) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen relative text-white font-sans overflow-hidden flex flex-col">
      {/* Background Video (Ice/Cloud Theme) */}
      <video className="fixed top-0 left-0 w-full h-full object-cover z-0 pointer-events-none opacity-40" autoPlay loop muted playsInline>
        <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
      </video>
      <div className="fixed top-0 left-0 w-full h-full z-0 bg-[#0a0b10]/60 backdrop-blur-md"></div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full h-[70px] bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/10 flex items-center px-6">
        <div className="flex items-center gap-3">
           <span className="text-xl font-black tracking-wider text-white">SMP</span>
        </div>
        <nav className="ml-12 flex space-x-6">
          <a href={`/dashboard/server/${params.id}`} className="flex items-center gap-2 text-white/80 hover:text-white pb-1 border-b-2 border-transparent hover:border-blue-500 transition-colors">
            <Terminal className="w-4 h-4" /> Console
          </a>
          <a href={`/dashboard/server/${params.id}/files`} className="flex items-center gap-2 text-white/80 hover:text-white pb-1 border-b-2 border-transparent hover:border-blue-500 transition-colors">
            <FolderOpen className="w-4 h-4" /> Files
          </a>
          <a href="#" className="flex items-center gap-2 text-white/80 hover:text-white pb-1 border-b-2 border-transparent hover:border-blue-500 transition-colors">
            <Database className="w-4 h-4" /> Databases
          </a>
          <a href="#" className="flex items-center gap-2 text-white/80 hover:text-white pb-1 border-b-2 border-transparent hover:border-blue-500 transition-colors">
            <Network className="w-4 h-4" /> Network
          </a>
          <a href="#" className="flex items-center gap-2 text-white/80 hover:text-white pb-1 border-b-2 border-transparent hover:border-blue-500 transition-colors">
            <PlayCircle className="w-4 h-4" /> Startup
          </a>
          <a href="#" className="flex items-center gap-2 text-white/80 hover:text-white pb-1 border-b-2 border-transparent hover:border-blue-500 transition-colors">
            <Settings className="w-4 h-4" /> Settings
          </a>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold uppercase tracking-wide">KAKA CHEATS PY</h2>
          <div className="flex gap-3">
            <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">Start</button>
            <button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-2 rounded-xl font-bold transition-all">Restart</button>
            <button className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]">Stop</button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
