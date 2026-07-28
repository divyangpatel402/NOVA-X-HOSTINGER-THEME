import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import fs from 'fs-extra';
import path from 'path';
const archiver = require('archiver');

export const dynamic = 'force-dynamic';

// List backups
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);
    
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const backupsDir = path.join(process.cwd(), ".data", "backups", id);
    await fs.ensureDir(backupsDir);

    const files = await fs.readdir(backupsDir);
    const backups = [];

    for (const file of files) {
      if (file.endsWith('.zip')) {
        const stats = await fs.stat(path.join(backupsDir, file));
        backups.push({
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime.toISOString()
        });
      }
    }

    // Sort by newest first
    backups.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(backups);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Create backup
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);
    
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const serverDir = path.join(process.cwd(), ".data", "servers", id);
    const backupsDir = path.join(process.cwd(), ".data", "backups", id);
    await fs.ensureDir(serverDir);
    await fs.ensureDir(backupsDir);

    const filename = `backup-${id}-${new Date().toISOString().replace(/[:.]/g, '-')}.zip`;
    const outputPath = path.join(backupsDir, filename);

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath);
      const archive = archiver('zip', {
        zlib: { level: 5 } // balance between speed and compression
      });

      output.on('close', () => {
        resolve(NextResponse.json({ success: true, filename, size: archive.pointer() }));
      });

      archive.on('error', (err) => {
        reject(NextResponse.json({ error: err.message }, { status: 500 }));
      });

      archive.pipe(output);
      archive.directory(serverDir, false);
      archive.finalize();
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete backup
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const backupsDir = path.join(process.cwd(), ".data", "backups", id);
    const backupPath = path.join(backupsDir, filename);

    if (!backupPath.startsWith(backupsDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    await fs.remove(backupPath);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Download backup
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { filename } = body;

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const backupsDir = path.join(process.cwd(), ".data", "backups", id);
    const backupPath = path.join(backupsDir, filename);

    if (!backupPath.startsWith(backupsDir)) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (!await fs.pathExists(backupPath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const fileBuffer = await fs.readFile(backupPath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

