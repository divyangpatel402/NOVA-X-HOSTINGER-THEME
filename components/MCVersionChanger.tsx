"use client";
import { useState, useEffect } from "react";
import { Download, RefreshCw, Box, AlertTriangle, Check } from "lucide-react";
import { alertDialog, confirmDialog } from "@/components/NovaConfirmModal";

interface MCVersionChangerProps {
  serverId: string;
}

const SOFTWARE_LIST = [
  { id: "paper", name: "Paper", desc: "High performance, plugin support (Recommended)" },
  { id: "purpur", name: "Purpur", desc: "Drop-in replacement for Paper with more features" },
  { id: "vanilla", name: "Vanilla", desc: "Original, unmodified Minecraft software" },
  { id: "forge", name: "Forge", desc: "For running mods (Client + Server)" },
  { id: "fabric", name: "Fabric", desc: "Lightweight modding toolchain" }
];

export default function MCVersionChanger({ serverId }: MCVersionChangerProps) {
  const [software, setSoftware] = useState("paper");
  const [version, setVersion] = useState("");
  const [versions, setVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    fetchVersions(software);
  }, [software]);

  const fetchVersions = async (soft: string) => {
    setLoadingVersions(true);
    setVersions([]);
    setVersion("");
    try {
      if (soft === "paper") {
        const res = await fetch("https://api.papermc.io/v2/projects/paper");
        const data = await res.json();
        const v = data.versions.reverse();
        setVersions(v);
        setVersion(v[0]);
      } else if (soft === "purpur") {
        const res = await fetch("https://api.purpurmc.org/v2/purpur");
        const data = await res.json();
        const v = data.versions.reverse();
        setVersions(v);
        setVersion(v[0]);
      } else {
        // Fallback dummy versions for Vanilla/Forge/Fabric for visual purposes if API isn't easy
        setVersions(["1.21.1", "1.21", "1.20.4", "1.19.4", "1.18.2", "1.17.1", "1.16.5", "1.12.2", "1.8.8"]);
        setVersion("1.21.1");
      }
    } catch (err) {
      console.error("Failed to fetch versions", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleInstall = async () => {
    if (!version) return;
    const isConfirm = await confirmDialog(`Are you sure you want to install ${software} ${version}? This will OVERWRITE your existing server.jar file!`, "Install Software", "warning");
    if (!isConfirm) return;

    setInstalling(true);
    try {
      const res = await fetch(`/api/client/servers/${serverId}/mc-version`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ software, version })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await alertDialog(`Successfully installed ${software} ${version}! Please restart your server.`, "Success", "success");
      } else {
        await alertDialog(data.error || "Failed to install version.", "Error", "danger");
      }
    } catch (err) {
      await alertDialog("Network error while installing.", "Error", "danger");
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="bg-[#121317]/95 border border-white/5 rounded-3xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <Download className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Version Changer</h2>
          <p className="text-sm text-white/50">Change your Minecraft server software and version with one click.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">1. Select Software</h3>
          <div className="space-y-2">
            {SOFTWARE_LIST.map(s => (
              <div 
                key={s.id}
                onClick={() => setSoftware(s.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${software === s.id ? 'bg-[#ff0f0f]/10 border-[#ff0f0f]/50' : 'bg-black/40 border-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Box className="w-4 h-4 text-white/50" /> {s.name}
                  </span>
                  {software === s.id && <Check className="w-4 h-4 text-[#ff0f0f]" />}
                </div>
                <p className="text-xs text-white/50 mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider">2. Select Version</h3>
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-4">
            {loadingVersions ? (
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <RefreshCw className="w-4 h-4 animate-spin" /> Fetching latest versions...
              </div>
            ) : (
              <div className="bg-[#121317]/50 border border-white/10 rounded-xl p-2 max-h-[250px] overflow-y-auto custom-scrollbar grid grid-cols-3 sm:grid-cols-4 gap-2">
                {versions.map(v => (
                  <button 
                    key={v}
                    onClick={() => setVersion(v)}
                    className={`px-2 py-2 rounded-lg text-xs font-bold transition-all truncate ${version === v ? 'bg-[#ff0f0f] text-white shadow-[0_0_15px_rgba(255,15,15,0.4)] scale-105' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
              <div className="text-sm text-yellow-500/90">
                <p className="font-bold mb-1">Warning</p>
                <p>Installing a new software version will overwrite your existing <code>server.jar</code>. Please ensure you have backed up your server before proceeding.</p>
              </div>
            </div>

            <button 
              onClick={handleInstall}
              disabled={installing || !version}
              className="w-full bg-[#ff0f0f] hover:bg-[#cc0000] disabled:bg-[#ff0f0f]/50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,15,15,0.2)] flex items-center justify-center gap-2"
            >
              {installing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Installing...</> : <><Download className="w-5 h-5" /> Install {software} {version}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
