import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    const node = db.nodes?.find(n => n.id === id);
    if (!node) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, node });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = readDB();
    const nodeIndex = db.nodes?.findIndex(n => n.id === id);
    if (nodeIndex === undefined || nodeIndex === -1) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }
    db.nodes![nodeIndex] = { ...db.nodes![nodeIndex], ...body };
    writeDB(db);
    return NextResponse.json({ success: true, node: db.nodes![nodeIndex] });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    if (db.nodes) {
      db.nodes = db.nodes.filter(n => n.id !== id);
    }
    if (db.allocations) {
      db.allocations = db.allocations.filter(a => a.nodeId !== id);
    }
    writeDB(db);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
