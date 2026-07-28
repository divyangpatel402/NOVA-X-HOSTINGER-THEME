import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { email, username } = await req.json();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUser = (username || '').trim().toLowerCase();

    if (!cleanEmail && !cleanUser) {
      return NextResponse.json({ error: "Email or username is required" }, { status: 400 });
    }

    const db = readDB();
    const servers = (db.pteroServers || []).filter(s => {
      const owner = (s.ownerEmail || '').trim().toLowerCase();
      if (!owner) return false; // Never match servers with empty or missing ownerEmail
      return (cleanEmail && owner === cleanEmail) || (cleanUser && owner === cleanUser);
    });
    
    return NextResponse.json({ success: true, servers });
  } catch (err) {
    console.error("Client Servers API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
