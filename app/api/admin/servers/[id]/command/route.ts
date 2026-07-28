import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { sendContainerCommand } from '@/lib/docker';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { command } = await req.json();

    if (!command) {
      return NextResponse.json({ error: "Command is required" }, { status: 400 });
    }

    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const containerId = server.containerId || `nova-server-${id}`;
    await sendContainerCommand(containerId, id, command);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Command error:", err);
    return NextResponse.json({ error: err.message || "Failed to send command" }, { status: 500 });
  }
}
