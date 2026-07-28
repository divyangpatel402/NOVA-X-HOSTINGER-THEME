"use client";
import React, { useState, useEffect } from "react";
import { AlertTriangle, ShieldAlert, CheckCircle, Info, X, Check, Trash2, HelpCircle } from "lucide-react";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info" | "success";
  isAlert?: boolean;
}

type ConfirmListener = (options: ConfirmOptions) => Promise<boolean>;

let currentListener: ConfirmListener | null = null;

export const confirmDialog = (
  messageOrOptions: string | ConfirmOptions,
  title?: string,
  type: "danger" | "warning" | "info" | "success" = "danger"
): Promise<boolean> => {
  if (!currentListener) {
    const msg = typeof messageOrOptions === "string" ? messageOrOptions : messageOrOptions.message;
    return Promise.resolve(window.confirm(msg));
  }

  if (typeof messageOrOptions === "string") {
    return currentListener({
      message: messageOrOptions,
      title: title || "Confirm Action",
      type: type || "danger",
      confirmText: type === "danger" ? "Confirm & Delete" : "Yes, Continue",
      cancelText: "Cancel",
      isAlert: false
    });
  } else {
    return currentListener({
      title: messageOrOptions.title || "Confirm Action",
      message: messageOrOptions.message,
      type: messageOrOptions.type || "danger",
      confirmText: messageOrOptions.confirmText || (messageOrOptions.type === "danger" ? "Confirm & Delete" : "Yes, Continue"),
      cancelText: messageOrOptions.cancelText || "Cancel",
      isAlert: messageOrOptions.isAlert || false
    });
  }
};

export const alertDialog = (
  message: string,
  title?: string,
  type: "danger" | "warning" | "info" | "success" = "info"
): Promise<boolean> => {
  if (!currentListener) {
    console.warn("Nova Alert:", message);
    return Promise.resolve(true);
  }
  return currentListener({
    message,
    title: title || "System Notification",
    type,
    confirmText: "OK, Got It",
    isAlert: true
  });
};

export default function NovaConfirmModal() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolver, setResolver] = useState<((val: boolean) => void) | null>(null);

  useEffect(() => {
    currentListener = (opts: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        setOptions(opts);
        setResolver(() => resolve);
      });
    };

    // Override global window.alert
    const originalAlert = window.alert;
    window.alert = (msg: string) => {
      alertDialog(msg, "Notification", "info");
    };

    return () => {
      currentListener = null;
      window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!options) return;
      if (e.key === "Escape") {
        handleClose(false);
      } else if (e.key === "Enter") {
        handleClose(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options]);

  const handleClose = (result: boolean) => {
    if (resolver) {
      resolver(result);
    }
    setOptions(null);
    setResolver(null);
  };

  if (!options) return null;

  const { title, message, confirmText, cancelText, type = "danger", isAlert = false } = options;

  const getConfig = () => {
    switch (type) {
      case "danger":
        return {
          icon: <ShieldAlert className="w-8 h-8 text-[#ff0f0f] animate-pulse" />,
          border: "border-[#ff0f0f]/30",
          glowBar: "bg-gradient-to-r from-red-600 via-rose-500 to-red-600 shadow-[0_0_25px_rgba(239,68,68,0.6)]",
          iconBg: "bg-[#ff0f0f]/15 shadow-[0_0_30px_rgba(239,68,68,0.3)] border border-[#ff0f0f]/20",
          btnBg: "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] hover:shadow-[0_0_30px_rgba(239,68,68,0.8)] text-white",
          btnIcon: <Trash2 className="w-4 h-4" />
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />,
          border: "border-amber-500/30",
          glowBar: "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)]",
          iconBg: "bg-amber-500/15 shadow-[0_0_30px_rgba(245,158,11,0.3)] border border-amber-500/20",
          btnBg: "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:shadow-[0_0_30px_rgba(245,158,11,0.8)] text-white",
          btnIcon: <AlertTriangle className="w-4 h-4" />
        };
      case "success":
        return {
          icon: <CheckCircle className="w-8 h-8 text-emerald-500 animate-pulse" />,
          border: "border-emerald-500/30",
          glowBar: "bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-[0_0_25px_rgba(16,185,129,0.6)]",
          iconBg: "bg-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/20",
          btnBg: "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.8)] text-white",
          btnIcon: <Check className="w-4 h-4" />
        };
      default: // info
        return {
          icon: <Info className="w-8 h-8 text-blue-500 animate-pulse" />,
          border: "border-blue-500/30",
          glowBar: "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 shadow-[0_0_25px_rgba(59,130,246,0.6)]",
          iconBg: "bg-blue-500/15 shadow-[0_0_30px_rgba(59,130,246,0.3)] border border-blue-500/20",
          btnBg: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:shadow-[0_0_30px_rgba(59,130,246,0.8)] text-white",
          btnIcon: <HelpCircle className="w-4 h-4" />
        };
    }
  };

  const config = getConfig();

  return (
    <div className="fixed inset-0 z-[99999] bg-[#05050a]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div 
        className={`bg-[#0e0f14]/95 border ${config.border} rounded-3xl max-w-md w-full shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden animate-in zoom-in-95 duration-300 transform transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top glowing bar */}
        <div className={`h-1.5 w-full ${config.glowBar}`} />

        <div className="p-7">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl ${config.iconBg} flex-shrink-0 flex items-center justify-center`}>
              {config.icon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-black text-white tracking-wide">{title}</h3>
              <p className="text-sm font-medium text-[#a1a1aa] leading-relaxed mt-2.5 font-sans whitespace-pre-wrap">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-8 pt-5 border-t border-white/5">
            {!isAlert && (
              <button
                onClick={() => handleClose(false)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
                {cancelText || "Cancel"}
              </button>
            )}
            <button
              onClick={() => handleClose(true)}
              className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer ${config.btnBg}`}
            >
              {config.btnIcon}
              {confirmText || "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
