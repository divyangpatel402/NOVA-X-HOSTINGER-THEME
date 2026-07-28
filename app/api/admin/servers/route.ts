import { NextResponse } from 'next/server';
import { readDB, writeDB, assignAllocationToServer } from '@/lib/db';
import { createServerContainer } from '@/lib/docker';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json({ success: true, servers: db.pteroServers || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.ownerEmail || !body.ownerEmail.trim()) {
      return NextResponse.json({ error: "Server Owner is required" }, { status: 400 });
    }
    const db = readDB();
    if (!db.pteroServers) db.pteroServers = [];

    const serverId = "srv_" + Date.now().toString(36);
    let nodeName = body.node || 'Node 1';
    let allocStr = body.allocation || '';
    if (!allocStr) {
      const allocRes = assignAllocationToServer(db, serverId, body.nodeId || body.node);
      nodeName = allocRes.nodeName;
      allocStr = allocRes.allocation;
    }

    const newServer = {
      id: serverId,
      name: body.name || 'New Server',
      ownerEmail: body.ownerEmail.trim(),
      node: nodeName,
      allocation: allocStr,
      eggId: body.eggId || '',
      limits: {
        memory: parseInt(body.memory) || 0,
        swap: parseInt(body.swap) || 0,
        disk: parseInt(body.disk) || 0,
        cpu: parseInt(body.cpu) || 0,
        io: 500
      },
      docker_image: body.docker_image || '',
      startup_command: body.startup_command || '',
      nest: body.nest || '',
      type: body.type || '',
      status: 'offline'
    };

    // Create container via Docker
    await createServerContainer(newServer);

    db.pteroServers.push(newServer);
    writeDB(db);

    return NextResponse.json({ success: true, server: newServer });
  } catch (err) {
    console.error("Server API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
