import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs-extra';
import path from 'path';

export const dynamic = 'force-dynamic';

const API_KEYS_FILE = path.join(process.cwd(), '.data', 'api_keys.json');

const readKeys = async () => {
  try {
    if (await fs.pathExists(API_KEYS_FILE)) {
      return await fs.readJson(API_KEYS_FILE);
    }
  } catch (e) {}
  return [];
};

const writeKeys = async (data: any) => {
  await fs.ensureDir(path.dirname(API_KEYS_FILE));
  await fs.writeJson(API_KEYS_FILE, data, { spaces: 2 });
};

// List API keys
export async function GET() {
  try {
    const keys = await readKeys();
    const keysWithoutHash = keys.map((key: any) => ({
      id: key.id,
      label: key.label,
      scopes: key.scopes,
      created_at: key.created_at,
      expires_at: key.expires_at,
      last_used_at: key.last_used_at,
      revoked: key.revoked
    }));
    return NextResponse.json(keysWithoutHash);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Create API Key
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { label, scopes, expires_at } = body;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomBytes = crypto.randomBytes(16);
    let rawKey = '';
    for (let i = 0; i < 16; i++) {
      rawKey += chars[randomBytes[i] % chars.length];
    }
    const keyString = `nova_${rawKey}`;
    const keyHash = crypto.createHash('sha256').update(keyString).digest('hex');

    const keys = await readKeys();

    const newKey = {
      id: crypto.randomUUID(),
      key_hash: keyHash,
      label: label || "Unnamed Key",
      scopes: scopes || ["*"],
      created_at: new Date().toISOString(),
      expires_at: expires_at || null,
      last_used_at: null,
      revoked: false
    };

    keys.push(newKey);
    await writeKeys(keys);

    return NextResponse.json({
      success: true,
      key: keyString, // Only shown once
      id: newKey.id,
      label: newKey.label,
      scopes: newKey.scopes,
      expires_at: newKey.expires_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
