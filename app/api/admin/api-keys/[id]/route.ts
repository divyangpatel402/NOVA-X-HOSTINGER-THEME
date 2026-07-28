import { NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

export const dynamic = 'force-dynamic';

const API_KEYS_FILE = path.join(process.cwd(), '.data', 'api_keys.json');

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!await fs.pathExists(API_KEYS_FILE)) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    const keys = await fs.readJson(API_KEYS_FILE);
    const index = keys.findIndex((k: any) => k.id === id);

    if (index === -1) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    keys.splice(index, 1);
    await fs.writeJson(API_KEYS_FILE, keys, { spaces: 2 });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
