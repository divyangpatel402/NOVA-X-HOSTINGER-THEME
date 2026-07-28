import { useState, useEffect } from "react";
import { Users, Shield, UserX, UserMinus, Plus, ShieldOff, RefreshCw, Activity } from "lucide-react";
import { alertDialog } from "@/components/NovaConfirmModal";

interface MCPlayerManagerProps {
  serverId: string;
  allocation?: string;
  isAdmin?: boolean;
}

export default function MCPlayerManager({ serverId, allocation, isAdmin = true }: MCPlayerManagerProps) {
  const [playerName, setPlayerName] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const [onlinePlayers, setOnlinePlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [serverStatus, setServerStatus] = useState<any>(null);

  const fetchOnlinePlayers = async () => {
    if (!allocation) return;
    setLoadingPlayers(true);
    try {
      // Clean allocation if it has extra spaces or something
      const ip = allocation.trim();
      const res = await fetch(`https://api.mcsrvstat.us/3/${ip}`);
      const data = await res.json();
      setServerStatus(data);
      if (data.online && data.players?.list) {
        setOnlinePlayers(data.players.list);
      } else {
        setOnlinePlayers([]);
      }
    } catch (err) {
      console.error("Failed to fetch players", err);
    } finally {
      setLoadingPlayers(false);
    }
  };

  useEffect(() => {
    fetchOnlinePlayers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOnlinePlayers, 30000);
    return () => clearInterval(interval);
  }, [allocation]);

  const sendCommand = async (cmd: string) => {
    if (!playerName.trim()) {
      return alertDialog("Please enter a player name first.", "Missing Player Name", "warning");
    }

    setSending(true);
    try {
      const endpoint = isAdmin 
        ? `/api/admin/servers/${serverId}/command` 
        : `/api/client/servers/${serverId}/command`;
        
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd })
      });
      if (res.ok) {
        setPlayerName("");
        setReason("");
        alertDialog(`Successfully executed: /${cmd}`, "Command Sent", "success");
      } else {
        alertDialog("Failed to send command to server.", "Error", "danger");
      }
    } catch (err) {
      alertDialog("Network error while sending command.", "Error", "danger");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#121317]/95 border border-white/5 rounded-3xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <Users className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Player Manager</h2>
          <p className="text-sm text-white/50">Quickly manage online players, bans, operators, and whitelists.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-black/40 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white/70 uppercase tracking-wider mb-4">Target Player</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Player Username (Exact Match)</label>
              <input 
                type="text" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. Notch"
                className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Reason (Optional for kick/ban)</label>
              <input 
                type="text" 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Breaking rules"
                className="w-full bg-[#121317] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            onClick={() => sendCommand(`op ${playerName}`)}
            disabled={sending}
            className="bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 p-4 rounded-xl transition-all flex flex-col items-center gap-2"
          >
            <Shield className="w-6 h-6" />
            <span className="font-bold text-sm">OP Player</span>
          </button>
          
          <button 
            onClick={() => sendCommand(`deop ${playerName}`)}
            disabled={sending}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 p-4 rounded-xl transition-all flex flex-col items-center gap-2"
          >
            <ShieldOff className="w-6 h-6" />
            <span className="font-bold text-sm">De-OP Player</span>
          </button>

          <button 
            onClick={() => sendCommand(`kick ${playerName} ${reason || "Kicked by Admin"}`)}
            disabled={sending}
            className="bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 text-yellow-500 p-4 rounded-xl transition-all flex flex-col items-center gap-2"
          >
            <UserMinus className="w-6 h-6" />
            <span className="font-bold text-sm">Kick Player</span>
          </button>

          <button 
            onClick={() => sendCommand(`ban ${playerName} ${reason || "Banned by Admin"}`)}
            disabled={sending}
            className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 p-4 rounded-xl transition-all flex flex-col items-center gap-2"
          >
            <UserX className="w-6 h-6" />
            <span className="font-bold text-sm">Ban Player</span>
          </button>

          <button 
            onClick={() => sendCommand(`whitelist add ${playerName}`)}
            disabled={sending}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl transition-all flex flex-col items-center gap-2"
          >
            <Plus className="w-6 h-6" />
            <span className="font-bold text-sm">Whitelist Add</span>
          </button>

          <button 
            onClick={() => sendCommand(`whitelist remove ${playerName}`)}
            disabled={sending}
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 p-4 rounded-xl transition-all flex flex-col items-center gap-2"
          >
            <UserMinus className="w-6 h-6" />
            <span className="font-bold text-sm text-center">Whitelist Remove</span>
          </button>
        </div>

        {/* Live Players Section */}
        {allocation && (
          <div className="bg-black/40 border border-white/5 rounded-2xl p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className={`w-5 h-5 ${serverStatus?.online ? 'text-emerald-500' : 'text-red-500'}`} />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live Online Players</h3>
                {serverStatus?.online && (
                  <span className="ml-2 bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {serverStatus.players?.online || 0} / {serverStatus.players?.max || 0}
                  </span>
                )}
              </div>
              <button 
                onClick={fetchOnlinePlayers}
                disabled={loadingPlayers}
                className="text-white/40 hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPlayers ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingPlayers && !serverStatus ? (
              <div className="flex justify-center items-center py-10">
                <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
              </div>
            ) : !serverStatus?.online ? (
              <div className="text-center py-10">
                <p className="text-red-400/80 text-sm">Server is currently offline or unreachable.</p>
              </div>
            ) : onlinePlayers.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-white/40 text-sm">No players are currently online.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {onlinePlayers.map((player: any, i: number) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setPlayerName(player.name);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group bg-white/5 border border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/10 rounded-xl p-3 flex flex-col items-center gap-3 cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  >
                    <img 
                      src={`https://mc-heads.net/avatar/${player.uuid || player.name}/100`} 
                      alt={player.name}
                      className="w-12 h-12 rounded-md shadow-md group-hover:shadow-emerald-500/20 transition-all"
                    />
                    <span className="text-xs font-bold text-white group-hover:text-emerald-400 truncate w-full text-center">
                      {player.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
