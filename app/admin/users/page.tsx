"use client";
import { useState, useEffect } from 'react';
import { Users, Shield, User } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/users', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.users);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 relative z-10">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Users Management</h2>
      </div>

      <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/50 border-b border-white/5">
            <tr>
              <th className="p-4 font-semibold">Username</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Role</th>
              <th className="p-4 font-semibold">2FA</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={4} className="p-4 text-center text-white/50">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-center text-white/50">No users found.</td></tr>
            ) : (
              users.map((u, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-medium text-blue-400 flex items-center gap-2">
                    {u.username} 
                    {u.role === 'admin' ? <Shield className="w-4 h-4 text-yellow-500" /> : <User className="w-4 h-4 text-white/50" />}
                  </td>
                  <td className="p-4 text-white/60">{u.email}</td>
                  <td className="p-4">
                    {u.role === 'admin' ? (
                      <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md text-xs font-bold">Administrator</span>
                    ) : (
                      <span className="bg-white/10 text-white/80 px-2 py-1 rounded-md text-xs font-bold">User</span>
                    )}
                  </td>
                  <td className="p-4"><span className="text-red-400 font-bold text-xs">Disabled</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

