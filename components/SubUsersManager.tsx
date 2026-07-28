"use client";
import React, { useState } from "react";
import { Users, UserPlus, Trash2, Mail, Shield, Check, Search, Filter, Lock, Unlock, Zap, Eye, ChevronDown, ChevronRight, CheckSquare, Square, AlertCircle, Edit3 } from "lucide-react";
import { confirmDialog } from "@/components/NovaConfirmModal";

interface PermissionGroup {
  id: string;
  title: string;
  description: string;
  permissions: { key: string; label: string; desc: string }[];
}

const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "control",
    title: "Control & Power",
    description: "Permissions to control the power state and access the live server terminal console.",
    permissions: [
      { key: "control.console", label: "Connect to Console", desc: "Allows sending terminal commands and viewing live server stdout." },
      { key: "control.start", label: "Start Server", desc: "Allows sending the start power signal to the container." },
      { key: "control.stop", label: "Stop Server", desc: "Allows gracefully shutting down the server process." },
      { key: "control.restart", label: "Restart Server", desc: "Allows rebooting the active server container." }
    ]
  },
  {
    id: "file",
    title: "File Management",
    description: "Permissions to browse, upload, edit, compress, and delete files in the file manager or SFTP.",
    permissions: [
      { key: "file.read", label: "List & Browse Files", desc: "Allows viewing directory listings and checking file attributes." },
      { key: "file.read-content", label: "Read File Contents", desc: "Allows opening text files inside the Monaco web editor." },
      { key: "file.create", label: "Create / Upload Files", desc: "Allows creating new directories, text files, or uploading via HTTP." },
      { key: "file.update", label: "Save & Rename Files", desc: "Allows modifying existing files and saving new content." },
      { key: "file.delete", label: "Delete Files", desc: "Allows permanently removing files and directories." },
      { key: "file.archive", label: "Compress & Decompress", desc: "Allows zipping directories or unzipping archives." },
      { key: "file.sftp", label: "SFTP Connection", desc: "Allows connecting with SFTP credentials using external FTP clients." }
    ]
  },
  {
    id: "backup",
    title: "Backup Management",
    description: "Permissions to create, download, restore, or delete full server snapshots.",
    permissions: [
      { key: "backup.create", label: "Create Snapshots", desc: "Allows initiating manual backup archives." },
      { key: "backup.read", label: "View Backups List", desc: "Allows listing existing backups and checking archive sizes." },
      { key: "backup.download", label: "Download Archive", desc: "Allows generating temporary signed URLs to download backup files." },
      { key: "backup.restore", label: "Restore Snapshot", desc: "Allows overwriting current server files with a saved backup." },
      { key: "backup.delete", label: "Delete Snapshots", desc: "Allows deleting old backups to free up server storage space." }
    ]
  },
  {
    id: "allocation",
    title: "Allocation & Network",
    description: "Permissions to assign, modify, and set primary network ports and IP aliases.",
    permissions: [
      { key: "allocation.read", label: "View Network Ports", desc: "Allows viewing assigned IP addresses and ports." },
      { key: "allocation.update", label: "Set Primary Port", desc: "Allows changing which allocation is marked as primary." }
    ]
  },
  {
    id: "startup",
    title: "Startup & Engine Switcher",
    description: "Permissions to change environment variables, startup commands, and switch Docker game engines.",
    permissions: [
      { key: "startup.read", label: "View Startup Params", desc: "Allows viewing memory limits and jarfile configurations." },
      { key: "startup.update", label: "Modify Environment", desc: "Allows editing variables like SERVER_JARFILE or MAX_PLAYERS." },
      { key: "egg.switch", label: "Switch Server Engine", desc: "Allows changing the server engine (Paper, Purpur, Forge, Bedrock)." }
    ]
  },
  {
    id: "user",
    title: "Subusers & Activity Log",
    description: "Permissions to invite other subusers, edit permissions, or review live security activity trails.",
    permissions: [
      { key: "user.read", label: "View Subusers List", desc: "Allows seeing other subusers assigned to this server." },
      { key: "user.create", label: "Invite Subusers", desc: "Allows sending subuser invitations and assigning permissions." },
      { key: "user.update", label: "Edit Permissions", desc: "Allows updating access rights of existing subusers." },
      { key: "user.delete", label: "Revoke Access", desc: "Allows removing subusers from this server." },
      { key: "activity.read", label: "View Security Audit Log", desc: "Allows reviewing past power, file, and console actions." }
    ]
  },
  {
    id: "database",
    title: "Databases & Schedules",
    description: "Permissions to create MySQL/MongoDB databases and configure automated cron tasks.",
    permissions: [
      { key: "database.read", label: "View Databases", desc: "Allows viewing database names, hosts, and connection strings." },
      { key: "database.create", label: "Create Database", desc: "Allows generating new SQL/NoSQL databases for plugins." },
      { key: "database.delete", label: "Delete Database", desc: "Allows dropping databases and removing credentials." },
      { key: "schedule.read", label: "View Automated Tasks", desc: "Allows listing configured cron jobs and scheduled restarts." },
      { key: "schedule.create", label: "Create Schedules", desc: "Allows setting up automated backups, restarts, or commands." }
    ]
  }
];

const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(g => g.permissions.map(p => p.key));

export default function SubUsersManager({ serverId }: { serverId: string }) {
  const [users, setUsers] = useState([
    { id: '1', email: 'co-owner@novahosting.com', username: 'NovaCoOwner', permissions: ALL_PERMISSIONS },
    { id: '2', email: 'moderator@novahosting.com', username: 'ServerMod', permissions: ['control.console', 'control.start', 'control.restart', 'file.read', 'file.read-content', 'activity.read'] }
  ]);
  
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<string[]>(PERMISSION_GROUPS.map(g => g.id));
  const [submitting, setSubmitting] = useState(false);

  const totalPermsCount = ALL_PERMISSIONS.length;
  const selectedCount = selectedPerms.length;

  const openAddModal = () => {
    setEditingUserId(null);
    setEmailInput("");
    setSelectedPerms(['control.console', 'control.start', 'control.restart', 'file.read']);
    setShowModal(true);
  };

  const openEditModal = (user: any) => {
    setEditingUserId(user.id);
    setEmailInput(user.email);
    setSelectedPerms(user.permissions || []);
    setShowModal(true);
  };

  const handleApplyPreset = (preset: 'full' | 'readonly' | 'basic' | 'none') => {
    if (preset === 'full') {
      setSelectedPerms(ALL_PERMISSIONS);
    } else if (preset === 'readonly') {
      setSelectedPerms(ALL_PERMISSIONS.filter(k => k.includes('.read') || k === 'control.console' || k === 'file.read-content'));
    } else if (preset === 'basic') {
      setSelectedPerms(['control.console', 'control.start', 'control.restart', 'control.stop', 'file.read', 'activity.read']);
    } else {
      setSelectedPerms([]);
    }
  };

  const handleToggleGroup = (groupId: string) => {
    const group = PERMISSION_GROUPS.find(g => g.id === groupId);
    if (!group) return;
    const groupKeys = group.permissions.map(p => p.key);
    const allSelected = groupKeys.every(k => selectedPerms.includes(k));

    if (allSelected) {
      setSelectedPerms(prev => prev.filter(k => !groupKeys.includes(k)));
    } else {
      setSelectedPerms(prev => Array.from(new Set([...prev, ...groupKeys])));
    }
  };

  const handleToggleOne = (key: string) => {
    if (selectedPerms.includes(key)) {
      setSelectedPerms(prev => prev.filter(k => k !== key));
    } else {
      setSelectedPerms(prev => [...prev, key]);
    }
  };

  const handleToggleExpand = (groupId: string) => {
    if (expandedGroups.includes(groupId)) {
      setExpandedGroups(prev => prev.filter(id => id !== groupId));
    } else {
      setExpandedGroups(prev => [...prev, groupId]);
    }
  };

  const handleSaveSubuser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return alert("Please enter a valid email address for the subuser.");
    if (selectedPerms.length === 0) return alert("Please grant at least one permission to this subuser.");

    setSubmitting(true);
    setTimeout(() => {
      if (editingUserId) {
        setUsers(prev => prev.map(u => u.id === editingUserId ? { ...u, email: emailInput, permissions: selectedPerms } : u));
      } else {
        const username = emailInput.split('@')[0];
        setUsers(prev => [...prev, { id: Date.now().toString(), email: emailInput, username, permissions: selectedPerms }]);
      }
      setSubmitting(false);
      setShowModal(false);
    }, 400);
  };

  const handleRemoveUser = async (id: string, email: string) => {
    if (!await confirmDialog(`Are you sure you want to revoke server access from ${email}?`, "Revoke Access", "danger")) return;
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  const filteredGroups = PERMISSION_GROUPS.map(group => {
    const matchingPerms = group.permissions.filter(p => 
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.key.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...group, permissions: matchingPerms };
  }).filter(group => group.permissions.length > 0 || group.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Bar */}
      <div className="bg-[#121317]/95 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ff0f0f]/15 border border-[#ff0f0f]/30 flex items-center justify-center text-[#ff0f0f]">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-wide flex items-center gap-2">
              Server Subusers
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-white/70 font-mono">{users.length}</span>
            </h3>
            <p className="text-xs text-white/50 mt-0.5">Grant granular access rights to team members, co-owners, and developers without sharing credentials.</p>
          </div>
        </div>

        <button 
          onClick={openAddModal} 
          className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg hover:shadow-[#ff0f0f]/30 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" /> Invite New Subuser
        </button>
      </div>

      {/* Subusers List */}
      <div className="bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 bg-white/[0.02] border-b border-white/5 flex items-center justify-between text-xs font-bold text-white/50 uppercase tracking-wider">
          <span>Assigned Members ({users.length})</span>
          <span>Permission Level</span>
        </div>

        <div className="divide-y divide-white/5">
          {users.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Shield className="w-10 h-10 text-white/20 mx-auto animate-pulse" />
              <p className="text-base font-bold text-white">No Subusers Configured</p>
              <p className="text-xs text-white/50 max-w-sm mx-auto">Invite moderators or co-developers to assist with server configurations, file management, or console monitoring.</p>
              <button onClick={openAddModal} className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#ff0f0f] hover:underline cursor-pointer">
                + Invite first member now
              </button>
            </div>
          ) : (
            users.map((u) => {
              const isFull = u.permissions.length === ALL_PERMISSIONS.length;
              return (
                <div key={u.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border font-bold text-sm ${
                      isFull ? 'bg-purple-500/15 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]' : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                    }`}>
                      {u.username ? u.username.slice(0, 2).toUpperCase() : <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-sm">{u.email}</h4>
                        {isFull && <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">Co-Owner</span>}
                      </div>
                      <p className="text-xs text-white/40 mt-0.5">Granted <span className="text-white/80 font-bold">{u.permissions.length}</span> of {totalPermsCount} total permissions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-1.5 max-w-md justify-end">
                      {isFull ? (
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Full Administrator Access
                        </span>
                      ) : (
                        u.permissions.slice(0, 4).map(p => (
                          <span key={p} className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-white/5 border border-white/10 text-white/70">
                            {p.split('.')[1] || p}
                          </span>
                        ))
                      )}
                      {!isFull && u.permissions.length > 4 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80">
                          +{u.permissions.length - 4} more
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                        title="Edit Permissions"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveUser(u.id, u.email)}
                        className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors cursor-pointer"
                        title="Revoke Access"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Permission Matrix Modal (Screenshot 1 Parity) */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-[#121317] border border-white/15 rounded-3xl w-[850px] max-w-[96vw] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 bg-white/[0.02] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ff0f0f]/15 border border-[#ff0f0f]/30 flex items-center justify-center text-[#ff0f0f]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{editingUserId ? "Edit Subuser Permissions" : "Invite & Configure Subuser"}</h3>
                  <p className="text-xs text-white/50">Select exact permissions or use presets for fast authorization.</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white cursor-pointer p-1">✕</button>
            </div>

            {/* Scrollable Modal Body */}
            <form onSubmit={handleSaveSubuser} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* User Identifier Input */}
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-[#ff0f0f]">User Email Address <span className="text-white/30 font-normal italic">(must be registered in client portal)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    required
                    placeholder="colleague@novahosting.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    disabled={!!editingUserId}
                    className="w-full bg-[#121317] border border-white/10 focus:border-[#ff0f0f]/60 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-white outline-none disabled:opacity-60 transition-colors"
                  />
                </div>
              </div>

              {/* Presets & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-white/40 uppercase mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('full')}
                    className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Zap className="w-3 h-3" /> Full Access (All {totalPermsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('readonly')}
                    className="px-3 py-1.5 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Eye className="w-3 h-3" /> Read-Only Access
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('basic')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Shield className="w-3 h-3" /> Basic Power & Console
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('none')}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 text-xs font-bold transition-all cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder={`Filter ${totalPermsCount} permissions...`}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder:text-white/30 outline-none focus:border-[#ff0f0f]/50 transition-colors"
                  />
                </div>
              </div>

              {/* Categorized Expandable Permission Groups */}
              <div className="space-y-4">
                {filteredGroups.map(group => {
                  const groupKeys = group.permissions.map(p => p.key);
                  const selectedInGroup = groupKeys.filter(k => selectedPerms.includes(k)).length;
                  const isAllSelected = selectedInGroup === groupKeys.length;
                  const isExpanded = expandedGroups.includes(group.id);

                  return (
                    <div key={group.id} className="border border-white/10 rounded-2xl overflow-hidden bg-black/20 transition-all">
                      {/* Group Header */}
                      <div 
                        onClick={() => handleToggleExpand(group.id)}
                        className="p-4 bg-white/[0.03] hover:bg-white/[0.05] border-b border-white/5 flex items-center justify-between cursor-pointer select-none transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleGroup(group.id);
                            }}
                            className="text-[#ff0f0f] focus:outline-none cursor-pointer p-0.5"
                          >
                            <input 
                              type="checkbox" 
                              checked={isAllSelected}
                              onChange={() => {}}
                              className="rounded bg-black/60 border-white/30 text-[#ff0f0f] focus:ring-0 cursor-pointer w-4 h-4 pointer-events-none"
                            />
                          </button>

                          <div>
                            <h4 className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{group.title}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                                isAllSelected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                                selectedInGroup > 0 ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                                'bg-white/5 text-white/40'
                              }`}>
                                {selectedInGroup} of {groupKeys.length} selected
                              </span>
                            </h4>
                            <p className="text-xs text-white/50 mt-0.5">{group.description}</p>
                          </div>
                        </div>

                        <div className="text-white/40">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </div>
                      </div>

                      {/* Group Permissions List */}
                      {isExpanded && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-black/40">
                          {group.permissions.map(perm => {
                            const isChecked = selectedPerms.includes(perm.key);
                            return (
                              <div
                                key={perm.key}
                                onClick={() => handleToggleOne(perm.key)}
                                className={`p-3 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                                  isChecked 
                                    ? 'bg-[#ff0f0f]/10 border-[#ff0f0f]/40 shadow-[0_0_15px_rgba(255,15,15,0.08)]' 
                                    : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
                                }`}
                              >
                                <div className="pt-0.5">
                                  <input 
                                    type="checkbox" 
                                    checked={isChecked}
                                    onChange={() => {}}
                                    className="rounded bg-black/60 border-white/30 text-[#ff0f0f] focus:ring-0 cursor-pointer w-4 h-4 pointer-events-none"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-white/80'}`}>{perm.label}</span>
                                    <span className="text-[10px] font-mono text-white/30 bg-black/30 px-1.5 py-0.5 rounded">{perm.key}</span>
                                  </div>
                                  <p className="text-[11px] text-white/50 mt-1 leading-relaxed">{perm.desc}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </form>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 text-xs font-bold text-white/70">
                <span className={`w-2 h-2 rounded-full ${selectedCount === totalPermsCount ? 'bg-purple-400 animate-pulse' : selectedCount > 0 ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span><span className="text-white font-mono">{selectedCount}</span> of {totalPermsCount} permissions granted</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveSubuser}
                  disabled={submitting}
                  className="bg-gradient-to-r from-[#ff0f0f] to-[#ff4d4d] hover:from-[#ff2222] hover:to-[#ff6b6b] disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-[#ff0f0f]/40 cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{submitting ? "Saving..." : editingUserId ? "Update Subuser Rights" : "Save & Invite Subuser"}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
