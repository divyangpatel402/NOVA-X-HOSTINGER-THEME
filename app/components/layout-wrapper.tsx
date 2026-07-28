'use client';

import { useState, useEffect } from "react";
import uiConfig from "../config/sections/ui.json";
import type { UIConfig } from "../types/ui";

const config = uiConfig as UIConfig;

function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 dark:bg-[#0a0b0f] transition-colors duration-300">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-gray-200 dark:border-gray-800 rounded-full animate-spin border-t-icon-primary"></div>
          <div className="absolute inset-2 w-8 h-8 border-2 border-gray-100 dark:border-gray-700 rounded-full animate-spin border-t-icon-primary animate-reverse opacity-70"></div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg text-gray-900 dark:text-white orbitron-font">
            Nova
          </span>
        </div>
      </div>
    </div>
  );
}

export function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(config.loading.enableLoadingScreen);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");

  useEffect(() => {
    // Check loading screen
    if (config.loading.enableLoadingScreen) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, config.loading.loadingDuration);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Check maintenance mode
    async function checkMaintenance() {
      try {
        const path = window.location.pathname;
        if (path.startsWith('/admin') || path.startsWith('/api/admin')) {
          return; // Allow admin access
        }

        const res = await fetch('/api/maintenance-status');
        const data = await res.json();
        if (data.maintenanceMode) {
          setIsMaintenance(true);
          setMaintenanceMsg(data.maintenanceMessage);
        }
      } catch (err) {
        console.error("Error checking maintenance mode:", err);
      }
    }
    checkMaintenance();
  }, []);

  if (isMaintenance) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center font-sans p-6 text-center relative overflow-hidden">
        {/* Background Video */}
        <video className="fixed top-0 left-0 w-full h-full object-cover z-0 opacity-35" autoPlay muted loop playsInline>
          <source src="/livechackoutvideo/fire.webm" type="video/webm" />
        </video>
        <div className="fixed top-0 left-0 w-full h-full bg-gradient-to-br from-[#050505]/95 to-[#050505]/75 backdrop-blur-[8px] z-10 pointer-events-none" />

        <div className="relative z-20 w-full max-w-lg p-10 bg-[#0f0f0f]/60 backdrop-blur-xl border border-[#ff0f0f]/15 rounded-3xl shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-[#ff0f0f]/10 border border-[#ff0f0f]/30 rounded-full flex items-center justify-center mx-auto text-[#ff0f0f] animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A1.79 1.79 0 1114.7 23.5l-5.83-5.83M11.42 15.17L6.25 20.33a1.79 1.79 0 01-2.5-2.5l5.83-5.83M11.42 15.17l2.42-2.41m-.01 0l3.41-3.41A1.79 1.79 0 0014.7 6.25l-3.41 3.41m.01 0L7.88 6.26A1.79 1.79 0 005.34 8.8l3.41 3.41m.01 0l-2.42 2.42m0 0l-5.83-5.83a1.79 1.79 0 012.5-2.5l5.83 5.83M8.8 11.42l5.83 5.83a1.79 1.79 0 102.5-2.5l-5.83-5.83" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-black tracking-wide text-white">UNDER MAINTENANCE</h1>
          <p className="text-[#a1a1aa] text-base leading-relaxed">{maintenanceMsg || "We are currently performing maintenance. Please check back soon!"}</p>
          
          <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-[#a1a1aa] uppercase tracking-wider">Need help? Contact support</span>
            <a href="https://discord.gg/novax" target="_blank" rel="noopener noreferrer" className="bg-[#ff0f0f] hover:bg-[#cc0000] text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all tracking-wider uppercase">
              Join Discord
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && config.loading.enableLoadingScreen && <LoadingScreen />}
      <div className={`transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
    </>
  );
}
