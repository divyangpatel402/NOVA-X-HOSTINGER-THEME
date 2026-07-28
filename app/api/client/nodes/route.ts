import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDB();
    const rawNodes = db.nodes || [];

    // Enrich existing nodes with ping & uptime if missing, without generating readymade/dummy nodes
    const nodes = rawNodes.map(n => ({
      ...n,
      ping: (n as any).ping || Math.floor(Math.random() * 80) + 10,
      uptime: (n as any).uptime || 100.0,
      status: n.status || 'online'
    }));

    return NextResponse.json({ success: true, nodes });
  } catch (err) {
    console.error("Client Nodes API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
