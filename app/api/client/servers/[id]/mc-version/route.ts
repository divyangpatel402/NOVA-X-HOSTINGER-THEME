import { NextResponse } from 'next/server';
import fs from 'fs-extra';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { software, version } = await req.json();

    if (!software || !version) {
      return NextResponse.json({ error: "Software and version are required" }, { status: 400 });
    }

    const serverDir = path.join(process.cwd(), ".data", "servers", id);
    if (!fs.existsSync(serverDir)) {
      await fs.ensureDir(serverDir);
    }

    let downloadUrl = "";

    if (software === "paper") {
      const buildsRes = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}`);
      if (!buildsRes.ok) return NextResponse.json({ error: "Failed to fetch Paper builds" }, { status: 400 });
      const buildsData = await buildsRes.json();
      const latestBuild = buildsData.builds[buildsData.builds.length - 1];

      const downloadRes = await fetch(`https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${latestBuild}`);
      if (!downloadRes.ok) return NextResponse.json({ error: "Failed to fetch Paper download details" }, { status: 400 });
      const downloadData = await downloadRes.json();
      const fileName = downloadData.downloads.application.name;

      downloadUrl = `https://api.papermc.io/v2/projects/paper/versions/${version}/builds/${latestBuild}/downloads/${fileName}`;
    } else if (software === "purpur") {
      downloadUrl = `https://api.purpurmc.org/v2/purpur/${version}/latest/download`;
    } else {
      return NextResponse.json({ error: "Unsupported software for automated download." }, { status: 400 });
    }

    const targetPath = path.join(serverDir, "server.jar");

    // Download the jar file
    const res = await fetch(downloadUrl);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to download JAR file from remote server." }, { status: 500 });
    }
    
    const arrayBuffer = await res.arrayBuffer();
    await fs.writeFile(targetPath, Buffer.from(arrayBuffer));

    return NextResponse.json({ success: true, message: `Successfully installed ${software} ${version}` });
  } catch (err: any) {
    console.error("MC Version install error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
