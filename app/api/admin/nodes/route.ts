import { NextResponse } from 'next/server';
import { readDB, writeDB, Node } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json({ success: true, nodes: db.nodes || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = readDB();
    if (!db.nodes) db.nodes = [];

    const newNode: Node = {
      id: "node_" + Date.now().toString(36),
      name: body.name || 'Unknown Node',
      fqdn: body.fqdn || '0.0.0.0',
      memory: Number(body.memory) || 0,
      disk: Number(body.disk) || 0,
      status: 'online' // We'll mock it as online for now
    };

    db.nodes.push(newNode);
    writeDB(db);

    return NextResponse.json({ success: true, node: newNode });
  } catch (err) {
    console.error("Node API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
