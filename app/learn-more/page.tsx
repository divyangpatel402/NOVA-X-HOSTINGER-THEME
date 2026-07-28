"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Server, Shield, Cpu, Zap, Activity, HardDrive, Headphones } from "lucide-react";
import Image from "next/image";

export default function LearnMorePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background Video */}
      <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-35" autoPlay muted loop playsInline>
        <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
      </video>
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#050505]/95 to-[#050505]/75 backdrop-blur-[8px] z-10 pointer-events-none" />

      {/* Main Container */}
      <div className="relative z-20 flex flex-col min-h-screen">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-[#ff0f0f]/10 py-4">
          <div className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
            <a href="/" className="text-2xl font-extrabold text-white flex items-center gap-2 tracking-wider font-mono">
            <div className="flex items-center gap-2">
              <img src="/logo/NOVA-LOGO.png" alt="NOVA" className="h-6 w-auto object-contain" />
              <span>NOVA X</span>
            </div>
            </a>
            <a href="/" className="text-[#a1a1aa] hover:text-white font-semibold text-sm transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" /> Return Home
            </a>
          </div>
        </nav>

        {/* Content */}
        <main className="max-w-[1200px] mx-auto w-full px-6 py-20 space-y-16 flex-1">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[#ff0f0f] text-xs font-black tracking-widest uppercase border border-[#ff0f0f]/20 bg-[#ff0f0f]/5 px-4 py-1.5 rounded-full">
              Why Choose NOVA X
            </span>
            <h1 className="text-4xl sm:text-5xl font-black tracking-wide text-white uppercase leading-tight">
              Enterprise Grade Hosting Infrastructure
            </h1>
            <p className="text-base text-[#a1a1aa] leading-relaxed">
              We leverage state-of-the-art server components, ddos mitigations, and custom control panels to deliver unmatched game hosting performance.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1 */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 hover:border-[#ff0f0f]/20 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 rounded-xl flex items-center justify-center text-[#ff0f0f]">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Ryzen 9 Processors</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Powered by latest AMD Ryzen 9 Series processors clocking up to 5.7GHz, ensuring high single-thread performance for your game instances.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 hover:border-[#ff0f0f]/20 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 rounded-xl flex items-center justify-center text-[#ff0f0f]">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Enterprise NVMe SSDs</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Superfast NVMe storage in RAID-1 configuration ensures ultra-low database delay and lightning fast map loading for multi-player games.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 hover:border-[#ff0f0f]/20 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 rounded-xl flex items-center justify-center text-[#ff0f0f]">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Multi-tbps DDoS Protection</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Always-on filtering hardware mitigates high-capacity network layer volumetric attacks, keeping your servers online under any threat.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 hover:border-[#ff0f0f]/20 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 rounded-xl flex items-center justify-center text-[#ff0f0f]">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">Automated Provisioning</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Instant delivery nodes automatically set up your services seconds after purchase. Credentials will be populated right inside your Client Space.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 hover:border-[#ff0f0f]/20 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 rounded-xl flex items-center justify-center text-[#ff0f0f]">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">99.99% Uptime Guarantee</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Redundant fiber uplinks, automatic path failovers, and Tier-3 datacenters allow us to back all hosting services with complete SLA guarantees.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 hover:border-[#ff0f0f]/20 transition-all duration-300 space-y-4">
              <div className="w-12 h-12 bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 rounded-xl flex items-center justify-center text-[#ff0f0f]">
                <Headphones className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase tracking-wide">24/7 Expert Support</h3>
              <p className="text-sm text-[#a1a1aa] leading-relaxed">
                Our support technicians are available round-the-clock inside our Discord server to help configure plugins, mods, or answer server questions.
              </p>
            </div>

          </div>

          {/* Call to Action */}
          <div className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#ff0f0f]/15 rounded-3xl p-10 text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-3xl font-black tracking-wide text-white uppercase">Ready to launch your server?</h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed max-w-xl mx-auto">
              Join thousands of clients hosting their gaming platforms with NOVA X. Create your account today to configure and setup your nodes in minutes.
            </p>
            <div className="flex justify-center gap-4 pt-2">
              <a href="/client?action=register" className="bg-[#ff0f0f] hover:bg-[#cc0000] text-white text-xs font-bold px-8 py-3 rounded-xl transition-all shadow-[0_4px_15px_rgba(255,15,15,0.2)] uppercase tracking-wider">
                Create Account
              </a>
              <a href="/" className="bg-transparent hover:bg-white/5 border border-[#1f1f1f] text-white text-xs font-bold px-8 py-3 rounded-xl transition-all uppercase tracking-wider">
                Browse Plans
              </a>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
