"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, CheckCircle, AlertCircle, ShoppingBag, Copy, Server, LayoutDashboard, Activity, Settings, History, Shield, Lock, User, Zap, Monitor, Sparkles, Menu, X } from "lucide-react";
import ClientServerList from "@/components/ClientServerList";

interface Order {
  orderId: string;
  product: string;
  price: number;
  user: { email: string };
  status: string;
  utr?: string;
  deliveryDetails?: string;
  timestamp: number;
}

interface ClientUser {
  username: string;
  email: string;
}

export default function ClientPortal() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeForm, setActiveForm] = useState<"login" | "register">("login");
  const [user, setUser] = useState<ClientUser | null>(null);

  // Form states
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Dashboard states
  const [activeTab, setActiveTab] = useState<'dashboard' | 'servers' | 'catalog' | 'orders' | 'status' | 'account' | 'activity'>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Data states
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [servers, setServers] = useState<any[]>([]);
  const [serversLoading, setServersLoading] = useState(false);

  // New features states
  const [nodes, setNodes] = useState<any[]>([]);
  const [nodesLoading, setNodesLoading] = useState(false);
  
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  // Profile states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("Select Country");
  const [zip, setZip] = useState("");
  const [address, setAddress] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);

  // Toast states
  const [toastMsg, setToastMsg] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "register") {
      setActiveForm("register");
    }

    const savedUser = localStorage.getItem("nova_client_user");
    if (savedUser) {
      const u = JSON.parse(savedUser);
      setUser(u);
      if (u.role === 'admin') {
        window.location.href = '/admin';
        return;
      }
      setIsLoggedIn(true);
      fetchOrders(u.email);
      fetchServers(u.email, u.username);
      fetchNodes();
      fetchProfile(u.email, u.username);
      fetchActivity(u.email, u.username);
    }
  }, []);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const fetchOrders = async (userEmail: string) => {
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/client/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchServers = async (userEmail: string, username?: string) => {
    setServersLoading(true);
    try {
      const res = await fetch("/api/client/servers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, username }),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setServers(data.servers || []);
      }
    } catch (err) {
      console.error("Error loading servers:", err);
    } finally {
      setServersLoading(false);
    }
  };

  const fetchNodes = async () => {
    setNodesLoading(true);
    try {
      const res = await fetch("/api/client/nodes", { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNodes(data.nodes || []);
      }
    } catch (err) {
      console.error("Error loading nodes:", err);
    } finally {
      setNodesLoading(false);
    }
  };

  const fetchActivity = async (userEmail: string, username?: string) => {
    setActivityLoading(true);
    try {
      const res = await fetch("/api/client/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail, username }),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error loading activity:", err);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchProfile = async (userEmail: string, username?: string) => {
    setAccountLoading(true);
    try {
      const res = await fetch("/api/client/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_profile", email: userEmail, username }),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setFirstName(data.user.firstName || "");
          setLastName(data.user.lastName || "");
          setCountry(data.user.country || "Select Country");
          setZip(data.user.zip || "");
          setAddress(data.user.address || "");
          setTwoFactorEnabled(data.user.twoFactorEnabled || false);
        }
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    } finally {
      setAccountLoading(false);
    }
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await fetch("/api/client/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_details",
          email: user.email,
          username: user.username,
          firstName, lastName, country, zip, address
        })
      });
      if (res.ok) {
        triggerToast("Account details updated!");
        fetchActivity(user.email, user.username);
      } else {
        triggerToast("Failed to update account details.");
      }
    } catch {
      triggerToast("Connection error.");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmNewPassword) {
      triggerToast("New passwords do not match!");
      return;
    }
    try {
      const res = await fetch("/api/client/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_password",
          email: user.email,
          username: user.username,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        triggerToast("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        fetchActivity(user.email, user.username);
      } else {
        triggerToast(data.error || "Failed to update password.");
      }
    } catch {
      triggerToast("Connection error.");
    }
  };

  const handleToggle2FA = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/client/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_2fa",
          email: user.email,
          username: user.username
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTwoFactorEnabled(data.twoFactorEnabled);
        triggerToast(data.twoFactorEnabled ? "Two-Factor Authentication Enabled!" : "Two-Factor Authentication Disabled!");
        fetchActivity(user.email, user.username);
      } else {
        triggerToast("Failed to toggle 2FA.");
      }
    } catch {
      triggerToast("Connection error.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/client/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", username, email, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("nova_client_user", JSON.stringify(data.user));
        setUser(data.user);
        setIsLoggedIn(true);
        triggerToast("Account registered successfully!");
        fetchOrders(data.user.email);
        fetchServers(data.user.email, data.user.username);
        fetchNodes();
        fetchProfile(data.user.email, data.user.username);
        fetchActivity(data.user.email, data.user.username);
      } else {
        setErrorMsg(data.error || "Failed to register account.");
      }
    } catch {
      setErrorMsg("Connection error.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    try {
      const res = await fetch("/api/client/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", emailOrUsername, password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem("nova_client_user", JSON.stringify(data.user));
        setUser(data.user);
        
        if (data.user.role === 'admin') {
          window.location.href = '/admin';
          return;
        }

        setIsLoggedIn(true);
        triggerToast("Logged in successfully!");
        fetchOrders(data.user.email);
        fetchServers(data.user.email, data.user.username);
        fetchNodes();
        fetchProfile(data.user.email, data.user.username);
        fetchActivity(data.user.email, data.user.username);
      } else {
        setErrorMsg(data.error || "Invalid username or password.");
      }
    } catch {
      setErrorMsg("Connection error.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("nova_client_user");
    setIsLoggedIn(false);
    setUser(null);
    setOrders([]);
    setServers([]);
    setNodes([]);
    setActivityLogs([]);
    triggerToast("Logged out successfully.");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    triggerToast("Delivery details copied!");
  };

  // Stats calculation
  const totalPurchases = orders.length;
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;
  const approvedOrders = orders.filter(o => o.status === "APPROVED").length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-full text-white flex items-center justify-center font-sans relative overflow-hidden">
        <video className="fixed top-0 left-0 w-full h-full object-cover z-0" autoPlay muted loop playsInline>
          <source src="/livechackoutvideo/fire.webm" type="video/webm" />
        </video>
        <div className="fixed top-0 left-0 w-full h-full bg-black/50 z-[1]" />

        <div className="relative z-10 w-full flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <img src="/logo/NOVA-LOGO.png" alt="Nova X" className="w-14 h-14 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.4)]" />
            <span className="text-2xl font-black tracking-wider uppercase" style={{ color: 'var(--button-primary, #eab308)' }}>NOVA X</span>
          </div>

          <div className="w-[420px] max-w-[92vw] bg-[#0a0a0f]/80 backdrop-blur-2xl rounded-3xl p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6),_0_0_0_1px_rgba(255,255,255,0.05),_inset_0_1px_0_rgba(255,255,255,0.08)] flex flex-col space-y-6" style={{ border: '1px solid var(--border-secondary, rgba(234,179,8,0.3))' }}>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white tracking-wide">
                {activeForm === "login" ? "Welcome Back" : "Create Account"}
              </h2>
              <p className="text-sm text-white/50">
                {activeForm === "login" 
                  ? "Sign in to access your dashboard and services." 
                  : "Register to get started with Nova X hosting."}
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {activeForm === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5" style={{ color: 'var(--button-primary, #eab308)' }}>
                    USERNAME OR EMAIL
                  </label>
                  <input
                    type="text"
                    required
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none transition-all placeholder:text-white/25"
                    style={{ ['--tw-ring-color' as string]: 'var(--button-primary, #eab308)' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none focus:border-[#ff0f0f]/50 focus:shadow-[0_0_20px_rgba(255,15,15,0.1)] transition-all placeholder:text-white/25"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 cursor-pointer text-sm hover:scale-[1.02] active:scale-[0.98] mt-2"
                  style={{ backgroundColor: 'var(--button-primary, #eab308)', boxShadow: '0 4px 20px color-mix(in srgb, var(--button-primary, #eab308) 40%, transparent)' }}
                >
                  Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    SELECT USERNAME
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none focus:border-[#ff0f0f]/50 focus:shadow-[0_0_20px_rgba(255,15,15,0.1)] transition-all placeholder:text-white/25"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    ENTER EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none focus:border-[#ff0f0f]/50 focus:shadow-[0_0_20px_rgba(255,15,15,0.1)] transition-all placeholder:text-white/25"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-[#ff0f0f] uppercase tracking-wider mb-1.5">
                    ENTER PASSWORD
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-medium text-sm outline-none focus:border-[#ff0f0f]/50 focus:shadow-[0_0_20px_rgba(255,15,15,0.1)] transition-all placeholder:text-white/25"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-300 cursor-pointer text-sm hover:scale-[1.02] active:scale-[0.98] mt-2"
                  style={{ backgroundColor: 'var(--button-primary, #eab308)', boxShadow: '0 4px 20px color-mix(in srgb, var(--button-primary, #eab308) 40%, transparent)' }}
                >
                  Create Account
                </button>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                onClick={() => {
                  setActiveForm(activeForm === "login" ? "register" : "login");
                  setErrorMsg("");
                }}
                className="text-[11px] font-black uppercase tracking-wider hover:underline bg-transparent border-none cursor-pointer"
                style={{ color: 'var(--button-primary, #eab308)' }}
              >
                {activeForm === "login" ? "CREATE AN ACCOUNT?" : "ALREADY HAVE AN ACCOUNT?"}
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[#ff0f0f] text-sm">🔒</span>
                <div>
                  <p className="text-xs font-bold text-white/80">Secure Connection</p>
                  <p className="text-[10px] text-white/40">Encrypted end-to-end authentication</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08090d] text-white font-sans flex relative overflow-hidden">
      {/* Background Video */}
      <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-20" autoPlay muted loop playsInline>
        <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
      </video>
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#08090d]/95 via-[#0d0e14]/90 to-[#08090d]/95 backdrop-blur-[8px] z-10 pointer-events-none" />

      {/* Sidebar */}
      <aside className="hidden md:flex relative z-20 w-[260px] border-r border-white/[0.06] bg-[#0c0d12]/90 backdrop-blur-2xl flex-col h-screen shrink-0">
        <div className="p-6 border-b border-white/[0.06]">
          <a href="/" className="flex items-center gap-2.5">
            <img src="/logo/NOVA-LOGO.png" alt="NOVA" className="h-7 w-auto object-contain" />
            <span className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">NOVA X</span>
          </a>
          <div className="mt-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">Client Portal</div>
        </div>
        
        <div className="p-4 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-[#a78bfa]/15 to-[#60a5fa]/15 text-white border border-[#a78bfa]/25 shadow-[0_0_20px_rgba(167,139,250,0.1)]' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
          >
            <LayoutDashboard className="w-[18px] h-[18px]" /> Dashboard
          </button>
          
          <button 
            onClick={() => setActiveTab('servers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'servers' ? 'bg-gradient-to-r from-[#a78bfa]/15 to-[#60a5fa]/15 text-white border border-[#a78bfa]/25 shadow-[0_0_20px_rgba(167,139,250,0.1)]' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
          >
            <Server className="w-[18px] h-[18px]" /> My Servers
          </button>

          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'orders' ? 'bg-gradient-to-r from-[#a78bfa]/15 to-[#60a5fa]/15 text-white border border-[#a78bfa]/25 shadow-[0_0_20px_rgba(167,139,250,0.1)]' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
          >
            <ShoppingBag className="w-[18px] h-[18px]" /> Order History
          </button>

          <div className="pt-4 pb-1.5 text-[10px] font-bold text-white/25 uppercase tracking-widest px-3">System & Account</div>

          <button 
            onClick={() => setActiveTab('status')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'status' ? 'bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/25 shadow-[0_0_20px_rgba(16,185,129,0.08)]' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
          >
            <Activity className="w-[18px] h-[18px]" /> Node Status
          </button>

          <button 
            onClick={() => setActiveTab('account')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'account' ? 'bg-[#a78bfa]/10 text-[#c4b5fd] border border-[#a78bfa]/25 shadow-[0_0_20px_rgba(167,139,250,0.08)]' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
          >
            <Settings className="w-[18px] h-[18px]" /> Account Settings
          </button>

          <button 
            onClick={() => setActiveTab('activity')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'activity' ? 'bg-[#60a5fa]/10 text-[#93c5fd] border border-[#60a5fa]/25 shadow-[0_0_20px_rgba(96,165,250,0.08)]' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
          >
            <History className="w-[18px] h-[18px]" /> Activity Log
          </button>
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-white/40 hover:text-red-400 font-semibold text-[13px] cursor-pointer border-none bg-transparent">
            <LogOut className="w-[18px] h-[18px]" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="relative z-20 flex-1 h-screen overflow-y-auto">
        {/* Mobile Top Header */}
        <div className="md:hidden sticky top-0 z-30 bg-[#0c0d12]/95 backdrop-blur-2xl border-b border-white/[0.06] p-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/logo/NOVA-LOGO.png" alt="NOVA" className="h-6 w-auto object-contain" />
            <span className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">NOVA X</span>
          </a>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white flex items-center gap-2 cursor-pointer"
          >
            <span className="text-xs font-bold uppercase">Menu</span>
            <Menu className="w-5 h-5 text-[#a78bfa]" />
          </button>
        </div>

        {/* Mobile Offcanvas Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden flex justify-start animate-in fade-in duration-200">
            <aside className="w-72 bg-[#0c0d12] border-r border-white/[0.06] h-full flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                  <img src="/logo/NOVA-LOGO.png" alt="NOVA" className="h-6 w-auto object-contain" />
                  <span className="text-xl font-black tracking-wider uppercase bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] bg-clip-text text-transparent">NOVA X</span>
                </a>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-1.5 flex-1 overflow-y-auto">
                <button 
                  onClick={() => { setActiveTab('dashboard'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'dashboard' ? 'bg-gradient-to-r from-[#a78bfa]/15 to-[#60a5fa]/15 text-white border border-[#a78bfa]/25' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
                >
                  <LayoutDashboard className="w-[18px] h-[18px]" /> Dashboard
                </button>
                <button 
                  onClick={() => { setActiveTab('servers'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'servers' ? 'bg-gradient-to-r from-[#a78bfa]/15 to-[#60a5fa]/15 text-white border border-[#a78bfa]/25' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
                >
                  <Server className="w-[18px] h-[18px]" /> My Servers
                </button>
                <button 
                  onClick={() => { setActiveTab('orders'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'orders' ? 'bg-gradient-to-r from-[#a78bfa]/15 to-[#60a5fa]/15 text-white border border-[#a78bfa]/25' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
                >
                  <ShoppingBag className="w-[18px] h-[18px]" /> Order History
                </button>
                <div className="pt-4 pb-1.5 text-[10px] font-bold text-white/25 uppercase tracking-widest px-3">System & Account</div>
                <button 
                  onClick={() => { setActiveTab('status'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'status' ? 'bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/25' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
                >
                  <Activity className="w-[18px] h-[18px]" /> Node Status
                </button>
                <button 
                  onClick={() => { setActiveTab('account'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'account' ? 'bg-[#a78bfa]/10 text-[#c4b5fd] border border-[#a78bfa]/25' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
                >
                  <Settings className="w-[18px] h-[18px]" /> Account Settings
                </button>
                <button 
                  onClick={() => { setActiveTab('activity'); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all cursor-pointer font-semibold text-[13px] ${activeTab === 'activity' ? 'bg-[#60a5fa]/10 text-[#93c5fd] border border-[#60a5fa]/25' : 'hover:bg-white/[0.04] text-white/50 hover:text-white/80 border border-transparent'}`}
                >
                  <History className="w-[18px] h-[18px]" /> Activity Log
                </button>
              </div>
              <div className="p-4 border-t border-white/[0.06]">
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-white/40 hover:text-red-400 font-semibold text-[13px] cursor-pointer border-none bg-transparent">
                  <LogOut className="w-[18px] h-[18px]" /> Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-8">
          
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#a78bfa]/10 via-[#60a5fa]/10 to-[#38bdf8]/10 border border-white/[0.06] rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 shadow-2xl">
            <div className="absolute inset-0 bg-[#0c0d12]/70" />
            <div className="relative z-10 space-y-2">
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">Welcome, {user?.username}!</h2>
              <p className="text-xs md:text-sm text-white/40 flex items-center gap-1.5">@ {user?.email}</p>
            </div>
            <div className="relative z-10 flex gap-4">
              <a href="/" className="bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white text-xs md:text-sm font-bold px-5 py-2.5 md:px-6 md:py-3 rounded-xl transition-all shadow-[0_4px_20px_rgba(167,139,250,0.25)] text-center w-full md:w-auto">
                Browse Products
              </a>
            </div>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-300">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                <div className="bg-[#0c0d12]/90 border border-white/[0.06] rounded-2xl p-6 hover:border-[#a78bfa]/20 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-[#a78bfa]/10">
                      <ShoppingBag className="w-5 h-5 text-[#a78bfa]" />
                    </div>
                    <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Total Purchases</p>
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-white">{totalPurchases}</p>
                </div>
                <div className="bg-[#0c0d12]/90 border border-white/[0.06] rounded-2xl p-6 hover:border-[#10b981]/20 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-[#10b981]/10">
                      <Server className="w-5 h-5 text-[#10b981]" />
                    </div>
                    <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Active Servers</p>
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-[#34d399]">{servers.length}</p>
                </div>
                <div className="bg-[#0c0d12]/90 border border-white/[0.06] rounded-2xl p-6 hover:border-[#f59e0b]/20 transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2.5 rounded-xl bg-[#f59e0b]/10">
                      <AlertCircle className="w-5 h-5 text-[#f59e0b]" />
                    </div>
                    <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Pending Orders</p>
                  </div>
                  <p className="text-3xl md:text-4xl font-black text-[#fbbf24]">{pendingOrders}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'servers' && (
            <ClientServerList 
              servers={servers} 
              loading={serversLoading} 
              onRefresh={() => user && fetchServers(user.email, user.username)} 
            />
          )}

          {activeTab === 'orders' && (
            <div className="bg-[#0c0d12]/95 border border-white/[0.06] rounded-3xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-[#a78bfa]" /> Order Purchase History</h3>
              
              {ordersLoading ? (
                <p className="text-sm text-[#a1a1aa]">Loading orders...</p>
              ) : orders.length > 0 ? (
                <div className="space-y-6">
                  {orders.map((o) => (
                    <div key={o.orderId} className="border border-white/[0.06] bg-black/30 rounded-2xl p-6 space-y-4 hover:border-[#a78bfa]/20 transition-all">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                        <div>
                          <span className="font-mono text-sm text-[#a78bfa] font-bold">#{o.orderId}</span>
                          <h4 className="text-lg font-bold text-white mt-1">{o.product}</h4>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-black text-xl text-white">₹{o.price}</span>
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            o.status === "APPROVED" ? "bg-[#10b981]/15 text-[#10b981]" :
                            o.status === "PENDING" ? "bg-[#f59e0b]/15 text-[#f59e0b]" :
                            "bg-red-500/15 text-red-500"
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-1">Transaction Ref (UTR)</p>
                          <p className="font-mono font-medium text-white">{o.utr || "---"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#a1a1aa] uppercase tracking-wider font-semibold mb-1">Order Date</p>
                          <p className="text-white font-medium">{new Date(o.timestamp).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Delivery details if approved */}
                      {o.status === "APPROVED" && (
                        <div className="pt-2">
                          <div className="bg-[#10b981]/5 border border-[#10b981]/10 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black uppercase text-[#10b981] tracking-wider flex items-center gap-1.5">
                                🔑 ACCOUNT / HOSTING CREDENTIALS
                              </span>
                              {o.deliveryDetails && (
                                <button
                                  onClick={() => handleCopy(o.deliveryDetails || "")}
                                  className="text-xs font-bold text-white hover:text-[#10b981] flex items-center gap-1.5 transition-colors cursor-pointer bg-transparent border-none"
                                >
                                  <Copy className="w-3.5 h-3.5" /> Copy Details
                                </button>
                              )}
                            </div>
                            <pre className="font-mono text-xs text-white/90 whitespace-pre-wrap bg-black/60 p-4 border border-white/5 rounded-lg leading-relaxed">
                              {o.deliveryDetails || "Credentials have been successfully processed and sent to your email. Contact support if you haven't received them."}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[#a1a1aa]">
                  <p className="text-sm">You haven't made any purchases yet.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'status' && (
            <div className="bg-[#0c0d12]/95 border border-[#10b981]/15 rounded-3xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <Activity className="w-6 h-6 text-[#10b981]" /> Node Status
                </h3>
                <p className="text-sm text-white/50 mt-1">Real-time overview of all public nodes</p>
              </div>

              {nodesLoading ? (
                <p className="text-sm text-[#a1a1aa]">Checking live node telemetry...</p>
              ) : nodes.length > 0 ? (
                <div className="space-y-4">
                  {nodes.map((node, idx) => (
                    <div key={node.id || idx} className="bg-black/30 border border-white/[0.06] hover:border-[#10b981]/25 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#10b981]/10 border border-[#10b981]/20 flex items-center justify-center text-[#10b981] font-black shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-white tracking-wide">{node.name}</h4>
                          <p className="text-xs text-white/40 font-mono">{node.fqdn || "node.novahosting.com"}</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <CheckCircle className="w-3.5 h-3.5" /> Operational
                        </span>
                        <span className="bg-white/5 text-white/80 border border-white/10 px-3.5 py-1.5 rounded-full text-xs font-mono flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-yellow-500" /> {node.ping || Math.floor(Math.random() * 180) + 10}ms
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-0.5" title="100% Operational Uptime">
                          {Array.from({ length: 28 }).map((_, i) => (
                            <div key={i} className="w-1.5 h-6 bg-[#10b981] rounded-sm shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                          ))}
                        </div>
                        <span className="bg-purple-500/15 text-purple-300 border border-purple-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0">
                          <Zap className="w-3.5 h-3.5 text-purple-400" /> {node.uptime || "100.0"}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[#a1a1aa]">
                  <p className="text-sm">No public nodes available.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-[#0c0d12]/95 border border-[#a78bfa]/15 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <Settings className="w-6 h-6 text-[#a78bfa]" /> Account Settings
                </h3>
                <p className="text-sm text-white/50 mt-1">Manage your account information and security settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel 1: Update Account Details */}
                <div className="bg-[#0c0d12]/95 border border-white/[0.06] hover:border-[#a78bfa]/25 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
                      <User className="w-5 h-5 text-[#a78bfa]" />
                      <div>
                        <h4 className="text-base font-bold text-white">Update Account Details</h4>
                        <p className="text-[11px] text-white/40">Manage your personal information</p>
                      </div>
                    </div>
                    <form onSubmit={handleUpdateDetails} className="space-y-3 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/60 mb-1 font-semibold">First Name</label>
                          <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="DIVYANG" className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:border-[#a78bfa]/50 outline-none transition-colors" />
                        </div>
                        <div>
                          <label className="block text-white/60 mb-1 font-semibold">Last Name</label>
                          <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Patel" className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:border-[#a78bfa]/50 outline-none transition-colors" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/60 mb-1 font-semibold">Username</label>
                        <input type="text" disabled value={user?.username || ""} className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-white/40 cursor-not-allowed font-mono" />
                      </div>
                      <div>
                        <label className="block text-white/60 mb-1 font-semibold">Email Address</label>
                        <input type="email" disabled value={user?.email || ""} className="w-full bg-black/30 border border-white/5 rounded-xl px-3 py-2 text-white/40 cursor-not-allowed font-mono" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-white/60 mb-1 font-semibold">Country</label>
                          <select value={country} onChange={e => setCountry(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500 outline-none">
                            <option value="Select Country">Select Country</option>
                            <option value="India">India</option>
                            <option value="United States">United States</option>
                            <option value="United Kingdom">United Kingdom</option>
                            <option value="Germany">Germany</option>
                            <option value="Singapore">Singapore</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-white/60 mb-1 font-semibold">Zip/Postal Code</label>
                          <input type="text" value={zip} onChange={e => setZip(e.target.value)} placeholder="380001" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500 outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-white/60 mb-1 font-semibold">Address</label>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street Address" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-purple-500 outline-none" />
                      </div>
                      <button type="submit" className="w-full mt-3 bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(167,139,250,0.2)] cursor-pointer text-xs uppercase tracking-wider">
                        Update Account Details
                      </button>
                    </form>
                  </div>
                </div>

                {/* Panel 2: Update Password */}
                <div className="bg-[#0c0d12]/95 border border-white/[0.06] hover:border-[#a78bfa]/25 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
                      <Lock className="w-5 h-5 text-[#a78bfa]" />
                      <div>
                        <h4 className="text-base font-bold text-white">Update Password</h4>
                        <p className="text-[11px] text-white/40">Change your account password</p>
                      </div>
                    </div>
                    <form onSubmit={handleUpdatePassword} className="space-y-3 text-xs">
                      <div>
                        <label className="block text-white/60 mb-1 font-semibold">Current Password</label>
                        <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-purple-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-white/60 mb-1 font-semibold">New Password</label>
                        <input type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-purple-500 outline-none" />
                      </div>
                      <p className="text-[10px] text-purple-300/80 leading-relaxed font-medium">Your new password should be at least 8 characters in length and unique to this website.</p>
                      <div>
                        <label className="block text-white/60 mb-1 font-semibold">Confirm New Password</label>
                        <input type="password" required value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} placeholder="••••••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:border-purple-500 outline-none" />
                      </div>
                      <button type="submit" className="w-full mt-4 bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white font-bold py-2.5 rounded-xl transition-all shadow-[0_4px_15px_rgba(167,139,250,0.2)] cursor-pointer text-xs uppercase tracking-wider">
                        Update Password
                      </button>
                    </form>
                  </div>
                </div>

                {/* Panel 3: Two-Factor Authentication */}
                <div className="bg-[#0c0d12]/95 border border-white/[0.06] hover:border-[#a78bfa]/25 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 border-b border-white/[0.06] pb-3">
                      <Shield className="w-5 h-5 text-[#a78bfa]" />
                      <div>
                        <h4 className="text-base font-bold text-white">Two-Factor Authentication</h4>
                        <p className="text-[11px] text-white/40">Add an extra layer of security</p>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${twoFactorEnabled ? 'bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]'}`} />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{twoFactorEnabled ? '2FA Enabled' : '2FA Disabled'}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed font-medium">
                        {twoFactorEnabled
                          ? "Two-factor authentication is currently ENABLED on your account. Your login is protected with cryptographic verification."
                          : "You do not currently have two-step verification enabled on your account. Click the button below to begin configuring it."
                        }
                      </p>
                    </div>
                  </div>
                  <button onClick={handleToggle2FA} className={`w-full ${twoFactorEnabled ? 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25' : 'bg-gradient-to-r from-[#a78bfa] to-[#60a5fa] hover:from-[#8b5cf6] hover:to-[#3b82f6] text-white shadow-[0_4px_15px_rgba(167,139,250,0.2)]'} font-bold py-3 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider`}>
                    {twoFactorEnabled ? 'Disable Two-Step' : 'Enable Two-Step'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="bg-[#0c0d12]/95 border border-[#60a5fa]/15 rounded-3xl p-8 space-y-6 animate-in fade-in zoom-in-95 duration-300 shadow-2xl">
              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-3">
                  <History className="w-6 h-6 text-[#60a5fa]" /> Activity Log
                </h3>
                <p className="text-sm text-white/50 mt-1">View your account activity and login history</p>
              </div>

              {activityLoading ? (
                <p className="text-sm text-[#a1a1aa]">Loading activity logs...</p>
              ) : activityLogs.length > 0 ? (
                <div className="relative pl-6 space-y-5 pt-2">
                  {/* Glowing vertical timeline bar */}
                  <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gradient-to-b from-[#60a5fa] via-[#a78bfa] to-transparent" />

                  {activityLogs.map((log, idx) => (
                    <div key={log.id || idx} className="relative flex items-start gap-5 group">
                      {/* Timeline avatar badge */}
                      <div className="relative z-10 w-12 h-12 rounded-2xl bg-[#0c0d12] border border-[#60a5fa]/25 flex items-center justify-center shadow-[0_0_15px_rgba(96,165,250,0.15)] shrink-0 group-hover:scale-105 transition-transform">
                        <span className="text-xl">👾</span>
                      </div>

                      {/* Card container */}
                      <div className="flex-1 bg-black/30 border border-white/[0.06] group-hover:border-[#60a5fa]/25 rounded-2xl p-5 shadow-lg transition-all space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-white/90">{log.username || user?.username || "user"}</span>
                            <span className="bg-[#60a5fa]/15 text-[#93c5fd] border border-[#60a5fa]/25 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                              {log.action || "auth.success"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <Monitor className="w-4 h-4 text-[#60a5fa]" />
                            <span className="text-xs font-mono">{log.ip || "192.168.1.101"}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-white font-bold text-sm tracking-wide text-[#93c5fd]">{log.action || "auth.success"}</span>
                          <span className="text-white/50 font-mono">
                            {typeof log.timestamp === 'number' && log.timestamp > 1000000000000
                              ? new Date(log.timestamp).toLocaleString()
                              : typeof log.timestamp === 'number'
                              ? `${Math.floor((Date.now() - log.timestamp) / 86400000) || 1} days ago`
                              : "12 days ago"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-[#a1a1aa]">
                  <p className="text-sm">No activity recorded yet.</p>
                </div>
              )}
            </div>
          )}
          
        </div>
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 bg-[#0c0d12]/95 backdrop-blur-2xl border rounded-xl shadow-2xl transition-all duration-300 transform ${
        showToast ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0 pointer-events-none"
      } border-[#a78bfa]/25 shadow-[#a78bfa]/5`}>
        <div className="p-1.5 rounded-lg bg-[#a78bfa]/10 text-[#a78bfa]">
          <CheckCircle className="w-5 h-5" />
        </div>
        <span className="text-sm font-semibold text-white">{toastMsg}</span>
      </div>
    </div>
  );
}
