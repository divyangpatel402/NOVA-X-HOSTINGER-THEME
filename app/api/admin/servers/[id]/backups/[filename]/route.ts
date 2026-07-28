import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import fs from 'fs-extra';
import path from 'path';

export const dynamic = 'force-dynamic';

// Download backup
export async function GET(req: Request, { params }: { params: Promise<{ id: string, filename: string }> }) {
  try {
    const { id, filename } = await params;
    
    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const backupsDir = path.join(process.cwd(), ".data", "backups", id);
    const filePath = path.join(backupsDir, filename);

    if (!await fs.pathExists(filePath)) {
      return NextResponse.json({ error: "Backup not found" }, { status: 404 });
    }

    const stat = await fs.stat(filePath);
    const fileStream = fs.createReadStream(filePath);
    
    // @ts-ignore
    return new NextResponse(fileStream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': stat.size.toString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Delete backup
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, filename: string }> }) {
  try {
    const { id, filename } = await params;
    
    // Prevent directory traversal
    if (filename.includes('..') || filename.includes('/')) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const backupsDir = path.join(process.cwd(), ".data", "backups", id);
    const filePath = path.join(backupsDir, filename);

    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Backup not found" }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
