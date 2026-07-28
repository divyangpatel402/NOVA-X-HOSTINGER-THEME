"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Folder, File, FileText, Upload, Plus, Trash2, Edit2, Download, ChevronRight, Save, X, ArrowLeft, RefreshCw, FolderPlus, Archive } from 'lucide-react';
import { confirmDialog } from '@/components/NovaConfirmModal';

interface FileItem {
  name: string;
  isDirectory: boolean;
  size: number;
  modified: string;
}

export default function FileManager({ serverId }: { serverId: string }) {
  const [currentPath, setCurrentPath] = useState('/');
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editor State
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, [currentPath]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files?path=${encodeURIComponent(currentPath)}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort: folders first, then files alphabetically
        const sorted = data.sort((a, b) => {
          if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
          return a.isDirectory ? -1 : 1;
        });
        setFiles(sorted);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const navigateTo = (folder: string) => {
    if (folder === '..') {
      const parts = currentPath.split('/').filter(Boolean);
      parts.pop();
      setCurrentPath('/' + parts.join('/'));
    } else {
      setCurrentPath(currentPath === '/' ? `/${folder}` : `${currentPath}/${folder}`);
    }
  };

  const openFile = async (filename: string) => {
    const fullPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/servers/${serverId}/files?path=${encodeURIComponent(fullPath)}`);
      const data = await res.json();
      if (data.isFile) {
        setFileContent(data.content);
        setEditingFile(fullPath);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to read file.");
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          path: editingFile,
          content: fileContent
        })
      });
      if (res.ok) {
        alert("File saved successfully.");
      } else {
        alert("Failed to save file.");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving file.");
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async (filename: string) => {
    if (!await confirmDialog(`Are you sure you want to delete ${filename}?`, "Delete File", "danger")) return;
    const fullPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          paths: [fullPath]
        })
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const renameFile = async (filename: string) => {
    const newName = prompt(`Enter new name for ${filename}:`, filename);
    if (!newName || newName === filename) return;
    
    const oldPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    const newPath = currentPath === '/' ? `/${newName}` : `${currentPath}/${newName}`;

    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rename',
          oldPath,
          newPath
        })
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const extractFile = async (filename: string) => {
    const fullPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract',
          path: fullPath
        })
      });
      if (res.ok) {
        alert("Extraction completed!");
        fetchFiles();
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to extract file.");
      }
    } catch (e) {
      console.error(e);
      alert("Error extracting file.");
    } finally {
      setLoading(false);
    }
  };

  const createItem = async (isDir: boolean) => {
    const name = prompt(`Enter new ${isDir ? 'folder' : 'file'} name:`);
    if (!name) return;
    const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          path: fullPath,
          isDir
        })
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const filesList = e.target.files;
    if (!filesList || filesList.length === 0) return;
    const file = filesList[0];

    const formData = new FormData();
    formData.append('file', file);
    formData.append('path', currentPath);

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        body: formData,
      });
      if (res.ok) {
        fetchFiles();
      } else {
        alert("Failed to upload file.");
      }
    } catch (e) {
      console.error(e);
      alert("Error uploading file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setLoading(false);
    }
  };

  const compressFiles = async () => {
    const fileNames = files.map(f => f.name);
    if (fileNames.length === 0) return alert("No files to compress.");
    const outputName = prompt("Archive name:", "archive.zip");
    if (!outputName) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'zip',
          dirPath: currentPath,
          fileNames,
          outputName
        })
      });
      if (res.ok) {
        alert("Compression completed!");
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to compress files.");
      }
    } catch (e) {
      alert("Error compressing files.");
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = async (filename: string) => {
    const fullPath = currentPath === '/' ? `/${filename}` : `${currentPath}/${filename}`;
    try {
      const res = await fetch(`/api/admin/servers/${serverId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'download',
          path: fullPath
        })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download file.");
      }
    } catch (e) {
      alert("Error downloading file.");
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (editingFile) {
    return (
      <div className="flex flex-col h-[600px] bg-[#050508] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#121317] border-b border-white/5 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditingFile(null)} className="text-[#a1a1aa] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-sm font-bold text-white tracking-wider">{editingFile}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={saveFile}
              disabled={saving}
              className="flex items-center gap-2 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save File'}
            </button>
          </div>
        </div>
        <textarea 
          className="flex-1 w-full bg-[#050508] text-gray-300 font-mono text-[13px] p-4 outline-none resize-none custom-scrollbar"
          value={fileContent}
          onChange={(e) => setFileContent(e.target.value)}
          spellCheck={false}
          style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
        />
      </div>
    );
  }

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="bg-[#050508] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[600px] animate-in fade-in zoom-in-95 duration-300">
      
      {/* Toolbar */}
      <div className="bg-[#121317] border-b border-white/5 px-4 py-4 flex flex-wrap items-center justify-between gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-[#a1a1aa] overflow-x-auto custom-scrollbar pb-1 flex-nowrap">
          <button 
            onClick={() => setCurrentPath('/')}
            className="hover:text-white transition-colors font-bold flex-shrink-0"
          >
            / root
          </button>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const pathSoFar = '/' + breadcrumbs.slice(0, idx + 1).join('/');
            return (
              <React.Fragment key={pathSoFar}>
                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                <button 
                  onClick={() => setCurrentPath(pathSoFar)}
                  className={`hover:text-white transition-colors font-bold flex-shrink-0 ${isLast ? 'text-white' : ''}`}
                >
                  {crumb}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchFiles()}
            disabled={loading}
            className="p-2 text-[#a1a1aa] hover:text-white hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="w-px h-5 bg-white/10 mx-1"></div>
          <button 
            onClick={() => createItem(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" /> New Folder
          </button>
          <button 
            onClick={() => createItem(false)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
          >
            <FileText className="w-4 h-4" /> New File
          </button>
          <div className="w-px h-5 bg-white/10 mx-1"></div>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-[#ff0f0f]/20 hover:bg-[#ff0f0f]/30 text-[#ff0f0f] px-4 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-[0_0_15px_rgba(255,15,15,0.2)]"
          >
            <Upload className="w-4 h-4" /> Upload
          </button>
          <button 
            onClick={compressFiles}
            disabled={loading || files.length === 0}
            className="flex items-center gap-2 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#3b82f6] px-4 py-1.5 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
          >
            <Archive className="w-4 h-4" /> Compress
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto bg-[#0a0a0f] custom-scrollbar">
        {loading && files.length === 0 ? (
           <div className="flex items-center justify-center h-full text-white/30 animate-pulse">
             Loading files...
           </div>
        ) : files.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-full text-white/30">
             <Folder className="w-12 h-12 mb-3 opacity-20" />
             <p>This directory is empty.</p>
           </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="text-xs text-white/50 uppercase bg-[#121317] sticky top-0 z-10 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-black tracking-widest">Name</th>
                <th className="px-6 py-4 font-black tracking-widest w-32">Size</th>
                <th className="px-6 py-4 font-black tracking-widest w-48 hidden md:table-cell">Last Modified</th>
                <th className="px-6 py-4 font-black tracking-widest w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentPath !== '/' && (
                <tr 
                  className="bg-[#0a0a0f] border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => navigateTo('..')}
                >
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <Folder className="w-5 h-5 text-[#3b82f6] fill-current opacity-80" />
                    ..
                  </td>
                  <td className="px-6 py-4">-</td>
                  <td className="px-6 py-4 hidden md:table-cell">-</td>
                  <td className="px-6 py-4 text-right"></td>
                </tr>
              )}
              {files.map((file) => (
                <tr key={file.name} className="bg-[#0a0a0f] border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                  <td 
                    className="px-6 py-4 font-medium text-white flex items-center gap-3 cursor-pointer"
                    onClick={() => file.isDirectory ? navigateTo(file.name) : openFile(file.name)}
                  >
                    {file.isDirectory ? (
                      <Folder className="w-5 h-5 text-[#3b82f6] fill-current opacity-80" />
                    ) : (
                      <File className="w-5 h-5 text-gray-400" />
                    )}
                    <span className="group-hover:text-[#ff0f0f] transition-colors">{file.name}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{file.isDirectory ? '-' : formatSize(file.size)}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{new Date(file.modified).toLocaleDateString()} {new Date(file.modified).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!file.isDirectory && (file.name.toLowerCase().endsWith('.zip') || file.name.toLowerCase().endsWith('.rar') || file.name.toLowerCase().endsWith('.tar.gz') || file.name.toLowerCase().endsWith('.tar')) && (
                        <button onClick={(e) => { e.stopPropagation(); extractFile(file.name); }} className="text-[#a1a1aa] hover:text-[#3b82f6] transition-colors" title="Extract Archive">
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      {!file.isDirectory && (
                        <button onClick={(e) => { e.stopPropagation(); downloadFile(file.name); }} className="text-[#a1a1aa] hover:text-[#10b981] transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); renameFile(file.name); }} className="text-[#a1a1aa] hover:text-white transition-colors" title="Rename">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteFile(file.name); }} className="text-[#a1a1aa] hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
