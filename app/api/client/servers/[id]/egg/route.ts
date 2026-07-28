import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { createServerContainer } from '@/lib/docker';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json({ success: true, eggs: db.eggs || [] });
  } catch (err) {
    console.error("Error fetching eggs for client:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { eggId, email, username } = body;

    if (!eggId) {
      return NextResponse.json({ error: "Egg ID is required" }, { status: 400 });
    }

    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Verify strict ownership
    const owner = (server.ownerEmail || '').trim().toLowerCase();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUser = (username || '').trim().toLowerCase();

    if (!owner || ((!cleanEmail || owner !== cleanEmail) && (!cleanUser || owner !== cleanUser))) {
      return NextResponse.json({ error: "Unauthorized access to this server" }, { status: 401 });
    }

    const targetEgg = db.eggs?.find(e => e.id === eggId);
    if (!targetEgg) {
      return NextResponse.json({ error: "Selected engine / egg not found" }, { status: 404 });
    }

    if (server.allowedEggs && Array.isArray(server.allowedEggs) && server.allowedEggs.length > 0) {
      if (!server.allowedEggs.includes(eggId) && server.eggId !== eggId) {
        return NextResponse.json({ error: "This server engine is not permitted for your current service plan." }, { status: 403 });
      }
    }

    // 2GB RAM Restriction for Minecraft Eggs
    const isMinecraft = targetEgg.nest === 'Minecraft' || targetEgg.name.toLowerCase().includes('minecraft');
    const currentRam = server.limits?.memory || 0;

    if (isMinecraft && currentRam < 2048) {
      return NextResponse.json({ 
        error: `Minecraft Java servers require at least 2048 MB (2 GB) RAM to operate stably. Your current server plan has ${currentRam} MB RAM. Please upgrade your server plan or select a lightweight engine like Discord Bot or Web Hosting.` 
      }, { status: 400 });
    }

    // Update server engine configuration
    server.eggId = targetEgg.id;
    server.docker_image = targetEgg.docker_image;
    server.startup_command = targetEgg.startup_command;
    server.nest = targetEgg.nest;

    // Recreate docker container with new configuration
    try {
      await createServerContainer(server);
    } catch (dockerErr) {
      console.error("Docker recreate error after egg switch:", dockerErr);
      // Even if docker fails locally, keep config updated in DB
    }

    writeDB(db);

    return NextResponse.json({ 
      success: true, 
      server, 
      message: `Successfully switched server engine to ${targetEgg.name}` 
    });
  } catch (err) {
    console.error("Error changing server egg:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
