import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { startup_command, docker_image, environment } = body;

    const db = readDB();
    if (!db.pteroServers) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const serverIndex = db.pteroServers.findIndex(s => s.id === id);
    if (serverIndex === -1) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Update the server's startup properties
    db.pteroServers[serverIndex].startup_command = startup_command;
    db.pteroServers[serverIndex].docker_image = docker_image;
    db.pteroServers[serverIndex].environment = environment;

    writeDB(db);

    return NextResponse.json({ success: true, server: db.pteroServers[serverIndex] });
  } catch (err: any) {
    console.error("Startup API Error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
