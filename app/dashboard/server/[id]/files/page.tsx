"use client";
import { Folder, FileText, MoreHorizontal } from 'lucide-react';

export default function ServerFiles() {
  const files = [
    { name: '__pycache__', type: 'folder', time: 'about 21 hours ago', size: '-' },
    { name: '.cache', type: 'folder', time: 'about 21 hours ago', size: '-' },
    { name: 'assets', type: 'folder', time: 'about 21 hours ago', size: '-' },
    { name: 'cogs', type: 'folder', time: 'about 21 hours ago', size: '-' },
    { name: '.env', type: 'file', time: '2 days ago', size: '445 Bytes' },
    { name: 'bot.py', type: 'file', time: '2 days ago', size: '6.08 KiB' },
    { name: 'main.py', type: 'file', time: '2 days ago', size: '102 Bytes' },
    { name: 'requirements.txt', type: 'file', time: '2 days ago', size: '170 Bytes' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-white/60 font-mono text-sm bg-[#121317]/80 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
          <span className="text-white hover:text-blue-400 cursor-pointer">/home</span>
          <span>/</span>
          <span className="text-white hover:text-blue-400 cursor-pointer">container</span>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all">Create Directory</button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">Upload</button>
          <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)]">New File</button>
        </div>
      </div>

      <div className="bg-[#121317]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <tbody className="divide-y divide-white/5">
            {files.map((file, i) => (
              <tr key={i} className="hover:bg-white/[0.02] group transition-colors">
                <td className="p-4 w-10">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-transparent" />
                </td>
                <td className="p-4 flex items-center gap-3">
                  {file.type === 'folder' ? <Folder className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-white/50" />}
                  <span className="font-medium">{file.name}</span>
                </td>
                <td className="p-4 text-white/50 w-32">{file.size}</td>
                <td className="p-4 text-white/50 w-48 text-right">{file.time}</td>
                <td className="p-4 w-12 text-right">
                  <button className="text-white/30 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
