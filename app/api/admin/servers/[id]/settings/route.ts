import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { getContainerStatus, deleteContainer, createServerContainer, getVersions } from '@/lib/docker';
import fs from 'fs-extra';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'PAPER';
    const versions = await getVersions(type);
    return NextResponse.json({ success: true, versions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { version, type } = body;
    
    if (!version) return NextResponse.json({ error: "Version is required" }, { status: 400 });
    
    const db = readDB();
    const serverIndex = db.pteroServers?.findIndex(s => s.id === id);
    
    if (serverIndex === undefined || serverIndex === -1) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const server = db.pteroServers![serverIndex];

    if (server.containerId) {
      const status = await getContainerStatus(server.containerId);
      if (status?.State?.Running) {
        return NextResponse.json({ error: "Server must be stopped before changing version. Please stop the server first." }, { status: 400 });
      }
      // Delete old container
      await deleteContainer(server.containerId);
    }
    
    // Automatically delete config files to avoid issues when switching versions/types
    const serverDir = path.join(process.cwd(), ".data", "servers", id);
    const filesToDelete = [
      "paper-global.yml", "paper-world-defaults.yml", "paper.yml",
      "config/paper-global.yml", "config/paper-world-defaults.yml",
      "world/data/random_sequences.dat"
    ];
    
    for (const file of filesToDelete) {
      const filePath = path.join(serverDir, file);
      try {
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
        }
      } catch (e) {
        console.error(`Failed to delete ${file}`, e);
      }
    }
    
    server.version = version;
    if (type) {
      server.type = type;
    }

    // Recreate container with new version env
    const newContainerId = await createServerContainer(server);
    server.containerId = newContainerId;
    
    writeDB(db);
    
    return NextResponse.json({ success: true, version, type: server.type });
  } catch (err: any) {
    console.error("Change version error", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
