import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDB();
    return NextResponse.json({ success: true, eggs: db.eggs || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = readDB();
    if (!db.eggs) db.eggs = [];
    if (!db.settings) db.settings = {};
    if (!db.settings.nests) db.settings.nests = [];
    if (!db.settings.customNests) db.settings.customNests = [];
    if (!db.settings.deletedNests) db.settings.deletedNests = [];

    const newEgg = {
      id: body.id || Date.now().toString(),
      name: body.name || 'Unknown Egg',
      description: body.description || '',
      nest: body.nest || 'General',
      docker_image: body.docker_image || '',
      startup_command: body.startup_command || '',
      author: body.author || 'Unknown'
    };

    // Auto-ensure the nest exists when adding an egg
    const nestName = newEgg.nest;
    if (nestName) {
      // Remove from deletedNests if it was previously deleted
      db.settings.deletedNests = db.settings.deletedNests.filter((n: string) => n.toLowerCase() !== nestName.toLowerCase());

      // Add to nests list if not already there
      if (!db.settings.nests.some((n: string) => n.toLowerCase() === nestName.toLowerCase())) {
        db.settings.nests.push(nestName);
      }
      // Add to customNests if not already there
      const existingCustom = db.settings.customNests.find((n: any) => (typeof n === 'string' ? n : n.name).toLowerCase() === nestName.toLowerCase());
      if (!existingCustom) {
        db.settings.customNests.push({ id: Date.now().toString(), name: nestName, description: '' });
      }
    }
    // Reset wipe-all flag since we're adding new eggs manually
    if (db.settings.eggsWipedAll) {
      db.settings.eggsWipedAll = false;
    }

    // Remove this egg id from deletedEggIds if it was previously deleted
    if (db.settings.deletedEggIds && Array.isArray(db.settings.deletedEggIds)) {
      db.settings.deletedEggIds = db.settings.deletedEggIds.filter((id: string) => id !== newEgg.id);
    }

    db.eggs.push(newEgg);
    writeDB(db);

    return NextResponse.json({ success: true, egg: newEgg });
  } catch (err) {
    console.error("Egg API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const all = url.searchParams.get('all') === 'true';
    const db = readDB();

    if (!db.settings) db.settings = {};
    if (!db.settings.deletedEggIds) db.settings.deletedEggIds = [];

    if (all) {
      if (db.eggs) {
        db.eggs.forEach(e => {
          if (!db.settings!.deletedEggIds!.includes(e.id)) {
            db.settings!.deletedEggIds!.push(e.id);
          }
        });
      }
      db.eggs = [];
      db.settings.eggsWipedAll = true;
      writeDB(db);
      return NextResponse.json({ success: true, message: "All eggs deleted and default sync disabled." });
    }

    let idsToDelete: string[] = [];
    try {
      const body = await req.json();
      if (body.ids && Array.isArray(body.ids)) {
        idsToDelete = body.ids;
      } else if (body.id) {
        idsToDelete = [body.id];
      }
    } catch {
      const idParam = url.searchParams.get('id');
      if (idParam) idsToDelete = [idParam];
    }

    if (idsToDelete.length > 0) {
      db.eggs = (db.eggs || []).filter(e => !idsToDelete.includes(e.id));
      idsToDelete.forEach(id => {
        if (!db.settings!.deletedEggIds!.includes(id)) {
          db.settings!.deletedEggIds!.push(id);
        }
      });
      writeDB(db);
      return NextResponse.json({ success: true, deleted: idsToDelete });
    }

    return NextResponse.json({ error: "No egg ID provided for deletion" }, { status: 400 });
  } catch (err) {
    console.error("Egg DELETE API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
