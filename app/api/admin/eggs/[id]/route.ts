import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = readDB();
    if (!db.eggs) return NextResponse.json({ error: "No eggs found" }, { status: 404 });

    const initialLen = db.eggs.length;
    db.eggs = db.eggs.filter(e => e.id !== id);

    if (db.eggs.length === initialLen) {
      return NextResponse.json({ error: "Egg not found" }, { status: 404 });
    }

    if (!db.settings) db.settings = {};
    if (!db.settings.deletedEggIds) db.settings.deletedEggIds = [];
    if (!db.settings.deletedEggIds.includes(id)) {
      db.settings.deletedEggIds.push(id);
    }

    writeDB(db);
    return NextResponse.json({ success: true, message: "Egg deleted successfully" });
  } catch (err) {
    console.error("Egg Delete API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = readDB();
    if (!db.eggs) return NextResponse.json({ error: "No eggs found" }, { status: 404 });

    const idx = db.eggs.findIndex(e => e.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Egg not found" }, { status: 404 });
    }

    db.eggs[idx] = { ...db.eggs[idx], ...body };
    writeDB(db);

    return NextResponse.json({ success: true, egg: db.eggs[idx] });
  } catch (err) {
    console.error("Egg Put API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
