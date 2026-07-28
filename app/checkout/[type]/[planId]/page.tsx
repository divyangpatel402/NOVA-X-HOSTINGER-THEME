"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Server } from "lucide-react";
import vpsConfig from "@/app/config/sections/vps.json";
import gamesConfig from "@/app/config/sections/games.json";
import dedicatedConfig from "@/app/config/sections/dedicated.json";
import discordConfig from "@/app/config/sections/discord.json";
import webhostingConfig from "@/app/config/sections/webhosting.json";

function parsePrice(p: any): number {
  if (typeof p === 'number') return p;
  if (typeof p === 'string') return parseFloat(p.replace(/[^\d.]/g, '')) || 0;
  return 0;
}

export default function CheckoutPage({ params }: { params: Promise<{ type: string, planId: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [clientUser, setClientUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [product, setProduct] = useState<{ name: string; price: number; clientConfig?: any } | null>(null);

  useEffect(() => {
    // Check client authentication
    const savedUser = localStorage.getItem("nova_client_user");
    if (!savedUser) {
      router.push("/client");
      return;
    }
    const parsedUser = JSON.parse(savedUser);
    setClientUser(parsedUser);
    setEmail(parsedUser.email);

    // Basic product finder logic
    const { type, planId } = unwrappedParams;
    let found: { name: string; price: number; clientConfig?: any } | null = null;
    
    if (type === "vps") {
      for (const plans of Object.values(vpsConfig.plans)) {
        const plan = (plans as any[]).find(p => p.id === planId);
        if (plan) found = { name: plan.name, price: parsePrice(plan.price), clientConfig: { type, planId, ram: plan.ram || plan.memory, cpu: plan.cpu || plan.vcpu, storage: plan.storage || plan.disk } };
      }
    } else if (type === "games") {
      for (const game of gamesConfig.games) {
        for (const plans of Object.values(game.plans)) {
          const plan = (plans as any[]).find(p => p.id === planId);
          if (plan) found = { name: plan.name, price: parsePrice(plan.price), clientConfig: { type, planId, ram: plan.ram || plan.memory, cpu: plan.cpu || plan.vcpu, storage: plan.storage || plan.disk } };
        }
      }
    } else if (type === "dedicated") {
      for (const plans of Object.values(dedicatedConfig.plans)) {
        const plan = (plans as any[]).find(p => p.id === planId);
        if (plan) found = { name: plan.name, price: parsePrice(plan.price), clientConfig: { type, planId, ram: plan.ram || plan.memory, cpu: plan.cpu || plan.vcpu, storage: plan.storage || plan.disk } };
      }
    } else if (type === "discord") {
      for (const plans of Object.values(discordConfig.plans)) {
        const plan = (plans as any[]).find(p => p.id === planId);
        if (plan) found = { name: plan.name, price: parsePrice(plan.price), clientConfig: { type, planId, ram: plan.ram || plan.memory, cpu: plan.cpu || plan.vcpu, storage: plan.storage || plan.disk } };
      }
    } else if (type === "webhosting") {
      for (const plans of Object.values(webhostingConfig.plans)) {
        const plan = (plans as any[]).find(p => p.id === planId);
        if (plan) found = { name: plan.name, price: parsePrice(plan.price), clientConfig: { type, planId, ram: plan.ram || plan.memory, cpu: plan.cpu || plan.vcpu, storage: plan.storage || plan.disk } };
      }
    }

    if (found) {
      setProduct(found);
    } else {
      router.push("/");
    }
  }, [unwrappedParams, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !product) return;
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: product.name,
          price: product.price,
          email,
          clientConfig: product.clientConfig
        })
      });
      
      const data = await res.json();
      if (data.success) {
        router.push(`/pay/${data.orderId}`);
      } else {
        alert(data.error || "Failed to create order");
      }
    } catch (err) {
      console.error(err);
      alert("Error processing checkout");
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col relative overflow-hidden">
      {/* Background Video */}
      <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-35" autoPlay muted loop playsInline>
        <source src="/livechackoutvideo/afterlogin.mp4" type="video/mp4" />
      </video>
      <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#050505]/95 to-[#050505]/75 backdrop-blur-[8px] z-10 pointer-events-none" />

      {/* Content wrapper on top of video and overlay */}
      <div className="relative z-20 flex flex-col flex-1">
        {/* Navbar equivalent */}
        <nav className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-xl border-b border-[#ff0f0f]/10 py-4">
          <div className="max-w-[1000px] mx-auto px-6 flex justify-between items-center">
            <a href="/" className="text-xl font-extrabold text-white flex items-center gap-2">
              <Server className="text-[#ff0f0f] w-6 h-6" /> NOVA X
            </a>
            <a href="/" className="text-[#a1a1aa] hover:text-white font-semibold text-sm transition-colors">
              Cancel
            </a>
          </div>
        </nav>

        <div className="max-w-xl mx-auto w-full px-6 py-24 flex-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#1f1f1f] rounded-2xl p-8 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/5">
              <div className="p-3 bg-[#ff0f0f]/10 border border-[#ff0f0f]/20 rounded-xl text-[#ff0f0f]">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Order Checkout</h1>
                <p className="text-[#a1a1aa] text-sm">Review your selection</p>
              </div>
            </div>

            <div className="mb-8 space-y-4">
              <div className="flex justify-between items-center p-5 bg-black/40 rounded-xl border border-[#1f1f1f]">
                <div>
                  <p className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1">Selected Plan</p>
                  <p className="font-bold text-white text-lg">{product.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider mb-1">Price</p>
                  <p className="font-black text-[#ff0f0f] text-2xl">₹{product.price}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#a1a1aa] mb-2">
                  Email Address for Delivery
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#ff0f0f]" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    readOnly
                    value={email}
                    className="block w-full pl-12 pr-4 py-3.5 border border-[#1f1f1f] rounded-xl bg-black/30 text-[#a1a1aa] font-mono transition-all outline-none select-none"
                  />
                </div>
                <p className="mt-3 text-xs text-[#a1a1aa]/80 font-medium leading-relaxed">
                  Logged in as <span className="text-white font-bold">{clientUser?.username}</span>. Delivery details and receipts will be automatically sent here.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#ff0f0f] hover:bg-[#cc0000] text-white px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 border border-transparent disabled:opacity-50 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? "Processing..." : "Continue to Payment"}
                {!isLoading && <ArrowRight className="w-5 h-5" />}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
