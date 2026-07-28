import { NextResponse } from 'next/server';
import { readDB, writeDB, releaseAllocationFromServer } from '@/lib/db';
import { startContainer, stopContainer, restartContainer } from '@/lib/docker';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);
    
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, server });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body; // start, stop, restart, suspend, unsuspend, etc.
    
    const db = readDB();
    const serverIndex = db.pteroServers?.findIndex(s => s.id === id);
    
    if (serverIndex === undefined || serverIndex === -1) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }
    
    const server = db.pteroServers[serverIndex];

    if (server.status === 'suspended' && (action === 'start' || action === 'restart')) {
      return NextResponse.json({ error: "Cannot start a suspended server. Please unsuspend it first." }, { status: 403 });
    }

    if (action === 'start') {
      await startContainer(`nova-server-${id}`, id, server);
      server.status = 'online';
    }
    else if (action === 'stop') {
      await stopContainer(`nova-server-${id}`, id);
      server.status = 'offline';
    }
    else if (action === 'restart') {
      await restartContainer(`nova-server-${id}`, id, server);
      server.status = 'online';
    }
    else if (action === 'suspend') {
      try { await stopContainer(`nova-server-${id}`, id); } catch(e) {}
      server.status = 'suspended';
    }
    else if (action === 'unsuspend') {
      server.status = 'offline';
    }
    else if (action === 'update-resources') {
      const { limits } = body;
      if (limits) {
        server.limits = { ...server.limits, ...limits };
      }
    }
    else if (action === 'transfer-owner') {
      const { ownerEmail } = body;
      if (ownerEmail) {
        server.ownerEmail = ownerEmail;
      }
    }
    else if (action === 'ip-alias') {
      const { ipAlias, allocation } = body;
      if (ipAlias !== undefined) server.ipAlias = ipAlias;
      if (allocation !== undefined) server.allocation = allocation;
    }
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    
    writeDB(db);
    
    return NextResponse.json({ success: true, status: server.status, server });
  } catch (err) {
    console.error("Docker power action error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    const serverIndex = db.pteroServers?.findIndex(s => s.id === id);
    
    if (serverIndex === undefined || serverIndex === -1) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }
    
    const server = db.pteroServers[serverIndex];

    // Delete docker container
    try {
      const { deleteContainer } = await import('@/lib/docker');
      await deleteContainer(server.containerId || `nova-server-${id}`);
    } catch (e) {
      console.error("Failed to delete docker container", e);
    }

    // Delete files
    try {
      const fs = await import('fs-extra');
      const path = await import('path');
      const serverDir = path.join(process.cwd(), ".data", "servers", id);
      if (await fs.pathExists(serverDir)) {
        await fs.remove(serverDir);
      }
    } catch (e) {
      console.error("Failed to delete server files", e);
    }

    // Release allocation
    releaseAllocationFromServer(db, id, server.allocation);

    // Remove from DB
    db.pteroServers.splice(serverIndex, 1);
    writeDB(db);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete server error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
