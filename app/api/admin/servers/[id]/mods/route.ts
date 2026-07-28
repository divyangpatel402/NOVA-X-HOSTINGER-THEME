import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import fs from 'fs-extra';
import path from 'path';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { pluginId, pluginName } = body;
    
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const serverDir = path.join(process.cwd(), ".data", "servers", id);
    const modsDir = path.join(serverDir, "mods");
    await fs.ensureDir(modsDir);

    if (!pluginId || !pluginName) {
      return NextResponse.json({ error: "Missing pluginId or pluginName" }, { status: 400 });
    }

    let downloadUrl = null;
    let filename = `${pluginName.replace(/[^a-zA-Z0-9]/g, '_')}.jar`;

    const verRes = await axios.get(`https://api.modrinth.com/v2/project/${pluginId}/version`);
    if (verRes.data && verRes.data.length > 0) {
      const file = verRes.data[0].files.find((f: any) => f.primary) || verRes.data[0].files[0];
      if (file) {
         downloadUrl = file.url;
         filename = file.filename || filename;
      }
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: "Could not find a valid download URL for this mod." }, { status: 404 });
    }

    const filePath = path.join(modsDir, filename);
    const response = await axios({
      url: downloadUrl,
      method: 'GET',
      responseType: 'stream',
      headers: {
         'User-Agent': 'React-Minecraft-Panel/1.0'
      }
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    await new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    return NextResponse.json({ success: true, message: "Mod installed successfully" });
  } catch (err: any) {
    console.error("Mod installation failed:", err.message);
    return NextResponse.json({ error: "Mod installation failed: " + err.message }, { status: 500 });
  }
}
