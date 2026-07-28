import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDB();
    const storedNests = db.settings?.nests || ["Game Servers", "Minecraft", "Discord Bot", "Web Hosting", "Databases", "Voice Servers", "General"];
    const customNests = db.settings?.customNests || [];
    const deletedNests = db.settings?.deletedNests || [];

    const allNests = Array.from(new Set([...storedNests, ...customNests.map((n: any) => typeof n === 'string' ? n : n.name)]))
      .filter((n: string) => !deletedNests.includes(n) && !deletedNests.includes(n.toLowerCase()));

    return NextResponse.json({ success: true, nests: allNests, customNests });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description } = body;
    if (!name) {
      return NextResponse.json({ error: "Nest name is required" }, { status: 400 });
    }

    const db = readDB();
    if (!db.settings) db.settings = {};
    if (!db.settings.customNests) db.settings.customNests = [];
    if (!db.settings.deletedNests) db.settings.deletedNests = [];
    if (!db.settings.nests) db.settings.nests = [];

    // Remove from deletedNests if it was previously deleted
    db.settings.deletedNests = db.settings.deletedNests.filter((n: string) => n.toLowerCase() !== name.toLowerCase());

    const existingCustom = db.settings.customNests.find((n: any) => (typeof n === 'string' ? n : n.name).toLowerCase() === name.toLowerCase());
    if (!existingCustom) {
      db.settings.customNests.push({ id: Date.now().toString(), name, description: description || '' });
    }
    if (!db.settings.nests.some((n: string) => n.toLowerCase() === name.toLowerCase())) {
      db.settings.nests.push(name);
    }
    writeDB(db);

    return NextResponse.json({ success: true, nest: { name, description } });
  } catch (err) {
    console.error("Nest POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === 'true';
    const name = url.searchParams.get('name');

    const db = readDB();
    if (!db.settings) db.settings = {};
    if (!db.settings.deletedNests) db.settings.deletedNests = [];
    if (!db.settings.customNests) db.settings.customNests = [];
    if (!db.settings.nests) db.settings.nests = [];

    if (all) {
      const allCurrent = Array.from(new Set([...db.settings.nests, ...db.settings.customNests.map((n: any) => typeof n === 'string' ? n : n.name)]));
      allCurrent.forEach((n: string) => {
        if (!db.settings!.deletedNests!.includes(n)) {
          db.settings!.deletedNests!.push(n);
        }
      });
      db.settings.nests = [];
      db.settings.customNests = [];
      writeDB(db);
      return NextResponse.json({ success: true, message: "All nests deleted" });
    }

    if (!name) {
      return NextResponse.json({ error: "Nest name required" }, { status: 400 });
    }

    if (!db.settings.deletedNests.includes(name)) {
      db.settings.deletedNests.push(name);
    }
    if (!db.settings.deletedNests.includes(name.toLowerCase())) {
      db.settings.deletedNests.push(name.toLowerCase());
    }

    db.settings.customNests = db.settings.customNests.filter((n: any) => (typeof n === 'string' ? n : n.name).toLowerCase() !== name.toLowerCase());
    db.settings.nests = db.settings.nests.filter((n: string) => n.toLowerCase() !== name.toLowerCase());
    writeDB(db);

    return NextResponse.json({ success: true, deleted: name });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
