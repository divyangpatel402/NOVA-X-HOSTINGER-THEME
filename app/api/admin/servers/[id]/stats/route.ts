import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import { getContainerStats } from '@/lib/docker';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const containerId = server.containerId || `nova-server-${id}`;
    const stats = await getContainerStats(containerId);

    return NextResponse.json({
      ...stats,
      limitRam: server.limits?.memory || 1024,
      limitCpu: server.limits?.cpu || 100,
      limitDisk: server.limits?.disk || 10240
    });
  } catch (err: any) {
    console.error("Stats error:", err);
    return NextResponse.json({ cpu: 0, ram: 0, disk: 0 }, { status: 200 });
  }
}
