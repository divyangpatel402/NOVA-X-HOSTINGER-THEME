"use client";
import { useState, useEffect, useRef } from "react";
import { FileText, RefreshCw, Download } from "lucide-react";
import { alertDialog } from "@/components/NovaConfirmModal";

interface MCLogsViewerProps {
  serverId: string;
}

export default function MCLogsViewer({ serverId }: MCLogsViewerProps) {
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files?path=${encodeURIComponent('/logs/latest.log')}`);
      const data = await res.json();
      if (res.ok && data.isFile) {
        setLogs(data.content);
      } else {
        setLogs("No latest.log found. The server may not have generated it yet.");
      }
    } catch (err) {
      setLogs("Failed to read logs/latest.log. Ensure the server is online and has generated log files.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [serverId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `latest-${serverId}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Syntax highlighter for Minecraft Logs
  const renderLogLines = () => {
    if (!logs) return null;
    const lines = logs.split("\n");
    return lines.map((line, i) => {
      let colorClass = "text-gray-300";
      
      if (line.includes("WARN")) {
        colorClass = "text-yellow-400";
      } else if (line.includes("ERROR") || line.includes("Exception") || line.includes("FATAL")) {
        colorClass = "text-red-400 font-bold";
      } else if (line.includes("INFO")) {
        colorClass = "text-gray-300";
      }

      if (line.match(/<[a-zA-Z0-9_]+>/)) {
        // Player Chat
        colorClass = "text-emerald-400";
      } else if (line.includes("joined the game") || line.includes("left the game")) {
        colorClass = "text-blue-400";
      }

      return (
        <div key={i} className="hover:bg-white/[0.02] px-2 py-0.5 rounded transition-colors break-all">
          <span className={colorClass}>{line}</span>
        </div>
      );
    });
  };

  return (
    <div className="bg-[#121317]/95 border border-white/5 rounded-3xl p-6 md:p-8 animate-in fade-in zoom-in-95 duration-300 flex flex-col h-[700px]">
      <div className="flex items-center justify-between gap-3 mb-6 border-b border-white/5 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#ff0f0f]/10 rounded-xl">
            <FileText className="w-6 h-6 text-[#ff0f0f]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">MC Logs Viewer</h2>
            <p className="text-sm text-white/50">Viewing logs/latest.log</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchLogs}
            disabled={loading}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={downloadLogs}
            className="p-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all"
            title="Download latest.log"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-[13px] leading-relaxed bg-[#050508] border border-white/5 rounded-xl shadow-inner custom-scrollbar"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}
      >
        {loading && !logs ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading logs...
          </div>
        ) : (
          renderLogLines()
        )}
      </div>
    </div>
  );
}
