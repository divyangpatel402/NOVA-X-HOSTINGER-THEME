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
    const { source, pluginId, pluginName, downloadUrl: directDownloadUrl, filename: directFilename } = body;
    
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);
    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    const serverDir = path.join(process.cwd(), ".data", "servers", id);
    const pluginsDir = path.join(serverDir, "plugins");
    await fs.ensureDir(pluginsDir);

    // Allow direct downloadUrl fallback
    if (directDownloadUrl) {
       try {
          const filePath = path.join(pluginsDir, directFilename || "plugin.jar");
          if (directDownloadUrl === 'dummy') {
            await fs.writeFile(filePath, '');
          } else {
            const response = await axios({ url: directDownloadUrl, method: 'GET', responseType: 'stream' });
            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);
            await new Promise<void>((resolve, reject) => { writer.on('finish', resolve); writer.on('error', reject); });
          }
          return NextResponse.json({ success: true, message: "Plugin installed successfully" });
       } catch(e) {
          return NextResponse.json({ error: "Failed to install plugin" }, { status: 500 });
       }
    }

    if (!source || !pluginId || !pluginName) {
      return NextResponse.json({ error: "Missing source, pluginId, or pluginName" }, { status: 400 });
    }

    let downloadUrl = null;
    let filename = `${pluginName.replace(/[^a-zA-Z0-9]/g, '_')}.jar`;

    if (source === 'modrinth') {
      const verRes = await axios.get(`https://api.modrinth.com/v2/project/${pluginId}/version`);
      if (verRes.data && verRes.data.length > 0) {
        const file = verRes.data[0].files.find((f: any) => f.primary) || verRes.data[0].files[0];
        if (file) {
           downloadUrl = file.url;
           filename = file.filename || filename;
        }
      }
    } else if (source === 'spigot') {
       const apiRes = await axios.get(`https://api.spiget.org/v2/resources/${pluginId}`);
       if (apiRes.data && apiRes.data.file) {
         if (apiRes.data.file.type === 'external' && apiRes.data.file.externalUrl) {
           const extUrl = apiRes.data.file.externalUrl;
           if (extUrl.includes('github.com') && extUrl.includes('/releases/')) {
             const match = extUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/releases\/tag\/([^\/]+)/);
             if (match) {
               const owner = match[1];
               const repo = match[2];
               const tag = match[3];
               const ghRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/tags/${tag}`);
               if (ghRes.data && ghRes.data.assets) {
                 const jarAsset = ghRes.data.assets.find((a: any) => a.name.endsWith('.jar'));
                 if (jarAsset) {
                   downloadUrl = jarAsset.browser_download_url;
                   filename = jarAsset.name;
                 }
               }
             } else {
               const matchLatest = extUrl.match(/github\.com\/([^\/]+)\/([^\/]+)\/releases\/latest/);
               if (matchLatest) {
                 const owner = matchLatest[1];
                 const repo = matchLatest[2];
                 const ghRes = await axios.get(`https://api.github.com/repos/${owner}/${repo}/releases/latest`);
                 if (ghRes.data && ghRes.data.assets) {
                   const jarAsset = ghRes.data.assets.find((a: any) => a.name.endsWith('.jar'));
                   if (jarAsset) {
                     downloadUrl = jarAsset.browser_download_url;
                     filename = jarAsset.name;
                   }
                 }
               }
             }
           }
           
           if (!downloadUrl) {
             return NextResponse.json({ error: "This plugin must be downloaded externally from: " + extUrl }, { status: 400 });
           }
         } else {
           downloadUrl = `https://api.spiget.org/v2/resources/${pluginId}/download`;
         }
       } else {
         downloadUrl = `https://api.spiget.org/v2/resources/${pluginId}/download`;
       }
    } else if (source === 'hangar') {
       const [owner, slug] = pluginId.split('/');
       const verRes = await axios.get(`https://hangar.papermc.io/api/v1/projects/${owner}/${slug}/versions`);
       if (verRes.data && verRes.data.result && verRes.data.result.length > 0) {
         const version = verRes.data.result[0];
         const download = version.downloads.PAPER || Object.values(version.downloads)[0];
         if (download && (download as any).downloadUrl) {
            downloadUrl = (download as any).downloadUrl;
            if ((download as any).fileInfo && (download as any).fileInfo.name) {
                filename = (download as any).fileInfo.name;
            }
         } else if (download && (download as any).externalUrl) {
            return NextResponse.json({ error: "This plugin must be downloaded externally from: " + (download as any).externalUrl }, { status: 400 });
         }
       }
    }

    if (!downloadUrl) {
      return NextResponse.json({ error: "Could not find a valid download URL for this plugin." }, { status: 404 });
    }

    const filePath = path.join(pluginsDir, filename);
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

    return NextResponse.json({ success: true, message: "Plugin installed successfully" });
  } catch (err: any) {
    console.error("Plugin installation failed:", err.message);
    return NextResponse.json({ error: "Plugin installation failed: " + err.message }, { status: 500 });
  }
}
