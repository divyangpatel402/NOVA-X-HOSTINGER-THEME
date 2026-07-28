"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Server, Settings, Users, Egg, LogOut, Network, Key, ShoppingBag, Menu, X } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('nova_client_user');
    if (!userStr) {
      router.push('/client');
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== 'admin') {
      router.push('/client');
      return;
    }
    setIsAdmin(true);
  }, [router]);

  if (!isAdmin) {
    return <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center font-mono">Verifying admin privileges...</div>;
  }

  return (
    <div className="min-h-screen relative text-white flex font-sans overflow-hidden">
      {/* Background Video */}
      <video className="fixed top-0 left-0 w-full h-full object-cover z-0 pointer-events-none opacity-40" autoPlay loop muted playsInline>
        <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
      </video>
      <div className="fixed top-0 left-0 w-full h-full z-0 bg-[#0a0b10]/60 backdrop-blur-md"></div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-[#0a0a0f]/80 backdrop-blur-xl border-r border-white/5 flex flex-col hidden md:flex relative z-10">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <a href="/admin" className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center">
              <img src="/logo/NOVA-LOGO.png" alt="NOVA" className="h-6 w-auto object-contain" />
            </span>
            <span className="font-black text-white tracking-widest text-sm uppercase font-mono">NOVA ADMIN</span>
          </a>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <a href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <LayoutDashboard className="w-5 h-5 text-[#ff0f0f]" /> Dashboard
          </a>
          <a href="/admin/servers" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <Server className="w-5 h-5 text-[#ff0f0f]" /> Servers
          </a>
          <a href="/admin/nodes" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <Network className="w-5 h-5 text-[#ff0f0f]" /> Nodes
          </a>
          <a href="/admin/nests" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <Egg className="w-5 h-5 text-[#ff0f0f]" /> Nests / Eggs
          </a>
          <a href="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <ShoppingBag className="w-5 h-5 text-[#ff0f0f]" /> Store Catalog
          </a>
          <a href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <Users className="w-5 h-5 text-[#ff0f0f]" /> Users
          </a>
          <a href="/admin/api-keys" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <Key className="w-5 h-5 text-[#ff0f0f]" /> API Keys
          </a>
          <a href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
            <Settings className="w-5 h-5 text-[#ff0f0f]" /> Settings
          </a>
        </nav>
        <div className="p-4 border-t border-white/5">
          <button onClick={() => { localStorage.removeItem('nova_client_user'); router.push('/client'); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-red-400 transition-colors">
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <div className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
        <div className={`absolute top-0 left-0 w-72 h-full bg-[#0a0a0f] border-r border-white/10 shadow-2xl flex flex-col transition-transform duration-300 transform ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <a href="/admin" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center">
                <img src="/logo/NOVA-LOGO.png" alt="NOVA" className="h-6 w-auto object-contain" />
              </span>
              <span className="font-black text-white tracking-widest text-sm uppercase font-mono">NOVA ADMIN</span>
            </a>
            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-white/5 rounded-lg text-white/50 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            <a href="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <LayoutDashboard className="w-5 h-5 text-[#ff0f0f]" /> Dashboard
            </a>
            <a href="/admin/servers" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <Server className="w-5 h-5 text-[#ff0f0f]" /> Servers
            </a>
            <a href="/admin/nodes" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <Network className="w-5 h-5 text-[#ff0f0f]" /> Nodes
            </a>
            <a href="/admin/nests" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <Egg className="w-5 h-5 text-[#ff0f0f]" /> Nests / Eggs
            </a>
            <a href="/admin/products" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <ShoppingBag className="w-5 h-5 text-[#ff0f0f]" /> Store Catalog
            </a>
            <a href="/admin/users" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <Users className="w-5 h-5 text-[#ff0f0f]" /> Users
            </a>
            <a href="/admin/api-keys" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <Key className="w-5 h-5 text-[#ff0f0f]" /> API Keys
            </a>
            <a href="/admin/settings" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white/80 hover:text-white">
              <Settings className="w-5 h-5 text-[#ff0f0f]" /> Settings
            </a>
          </nav>
          <div className="p-4 border-t border-white/5">
            <button onClick={() => { localStorage.removeItem('nova_client_user'); router.push('/client'); }} className="flex items-center gap-3 px-4 py-3 w-full rounded-xl hover:bg-red-500/10 text-red-400 transition-colors cursor-pointer">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 w-full">
        {/* Header (Desktop) */}
        <header className="hidden md:flex h-[70px] border-b border-white/5 bg-[#0a0a0f]/50 backdrop-blur-md items-center px-8 shrink-0">
          <h1 className="text-lg font-bold text-white/90">Administration</h1>
        </header>

        {/* Header (Mobile) */}
        <header className="md:hidden h-[70px] border-b border-white/5 bg-[#0a0a0f]/90 backdrop-blur-md flex items-center justify-between px-5 shrink-0 sticky top-0 z-30">
          <h1 className="text-lg font-bold text-white/90 flex items-center gap-2">
             <span className="w-6 h-6 rounded flex items-center justify-center">
              <img src="/logo/NOVA-LOGO.png" alt="NOVA" className="h-5 w-auto object-contain" />
            </span>
            NOVA ADMIN
          </h1>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-white cursor-pointer">
            <Menu className="w-6 h-6 text-[#ff0f0f]" />
          </button>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 md:p-8 w-full max-w-[100vw]">
          {children}
        </div>
      </main>
    </div>
  );
}
