import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';
import fs from 'fs-extra';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const dirPath = searchParams.get('path') || '/';
    
    // Verify server exists
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);
    if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

    const targetPath = path.join(process.cwd(), ".data", "servers", id, dirPath);
    
    // Security check: Prevent path traversal
    if (!targetPath.startsWith(path.join(process.cwd(), ".data", "servers", id))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    const stats = await fs.stat(targetPath).catch(() => null);
    
    if (!stats) {
      return NextResponse.json([]); // Return empty if directory not found
    }

    if (stats.isFile()) {
       const content = await fs.readFile(targetPath, "utf-8");
       return NextResponse.json({ isFile: true, content });
    }

    const files = await fs.readdir(targetPath, { withFileTypes: true });
    
    const formattedFiles = files.map(f => {
      const isDir = f.isDirectory();
      let size = 0;
      let modified = new Date();
      try {
          const stat = fs.statSync(path.join(targetPath, f.name));
          size = isDir ? 0 : stat.size;
          modified = stat.mtime;
      } catch(e) {}
      
      return {
        name: f.name,
        isDirectory: isDir,
        size: size,
        modified: modified
      };
    });

    return NextResponse.json(formattedFiles);
  } catch (err: any) {
    console.error("File GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Verify server exists
    const db = readDB();
    const server = db.pteroServers?.find(s => s.id === id);
    if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

    const contentType = req.headers.get('content-type') || '';
    const basePath = path.join(process.cwd(), ".data", "servers", id);

    // Handle Multipart Form Data for Uploads
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const uploadPath = (formData.get('path') as string) || '/';
      
      if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

      const targetDir = path.join(basePath, uploadPath);
      
      if (!targetDir.startsWith(basePath)) return NextResponse.json({ error: "Invalid path" }, { status: 403 });
      
      await fs.ensureDir(targetDir);
      
      const targetFilePath = path.join(targetDir, file.name);
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      await fs.writeFile(targetFilePath, buffer);
      
      return NextResponse.json({ success: true });
    }

    // Handle JSON Actions (delete, rename, create, save)
    const body = await req.json();
    const { action } = body;

    if (action === 'delete') {
      const paths = body.paths as string[];
      for (const p of paths) {
        const targetPath = path.join(basePath, p);
        if (targetPath.startsWith(basePath)) {
          await fs.remove(targetPath);
        }
      }
      return NextResponse.json({ success: true });
    }
    
    if (action === 'rename') {
      const { oldPath, newPath } = body;
      const targetOldPath = path.join(basePath, oldPath);
      const targetNewPath = path.join(basePath, newPath);
      
      if (targetOldPath.startsWith(basePath) && targetNewPath.startsWith(basePath)) {
        await fs.rename(targetOldPath, targetNewPath);
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (action === 'create') {
      const { path: newPath, isDir } = body;
      const targetPath = path.join(basePath, newPath);
      if (targetPath.startsWith(basePath)) {
        if (isDir) {
          await fs.mkdir(targetPath, { recursive: true });
        } else {
          await fs.writeFile(targetPath, "", "utf-8");
        }
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (action === 'save') {
      const { path: savePath, content } = body;
      const targetPath = path.join(basePath, savePath);
      if (targetPath.startsWith(basePath)) {
        await fs.writeFile(targetPath, content, "utf-8");
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Invalid path" }, { status: 403 });
    }

    if (action === 'extract') {
      const { path: extractPath } = body;
      const targetPath = path.join(basePath, extractPath);
      
      if (!targetPath.startsWith(basePath)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 403 });
      }

      const ext = path.extname(targetPath).toLowerCase();
      const dir = path.dirname(targetPath);

      try {
        if (ext === '.zip') {
          // Try extract-zip first, fallback to unzip command
          try {
            const extract = (await import('extract-zip')).default;
            await extract(targetPath, { dir });
          } catch(e) {
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);
            await execPromise(`unzip -o "${targetPath}" -d "${dir}"`);
          }
        } else if (ext === '.rar') {
          const { exec } = require('child_process');
          const util = require('util');
          const execPromise = util.promisify(exec);
          await execPromise(`unrar x -o+ "${targetPath}" "${dir}/"`);
        } else if (ext === '.gz' || targetPath.endsWith('.tar.gz')) {
          const { exec } = require('child_process');
          const util = require('util');
          const execPromise = util.promisify(exec);
          await execPromise(`tar -xzf "${targetPath}" -C "${dir}"`);
        } else {
          return NextResponse.json({ error: "Unsupported archive format. Supported: .zip, .rar, .tar.gz" }, { status: 400 });
        }
        return NextResponse.json({ success: true });
      } catch (err: any) {
        console.error("Extraction error:", err);
        return NextResponse.json({ error: "Failed to extract: " + (err.message || "Unknown error") }, { status: 500 });
      }
    }

    if (action === 'zip') {
      const { dirPath, fileNames, outputName } = body;
      const baseDir = path.join(basePath, dirPath || '/');
      const outZipPath = path.join(baseDir, outputName || 'archive.zip');

      if (!baseDir.startsWith(basePath)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 403 });
      }

      try {
        const archiver = (await import('archiver')).default;
        const output = fs.createWriteStream(outZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        await new Promise<void>((resolve, reject) => {
          output.on('close', resolve);
          archive.on('error', reject);
          archive.pipe(output);

          for (const name of fileNames) {
            const filePath = path.join(baseDir, name);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              archive.directory(filePath, name);
            } else {
              archive.file(filePath, { name });
            }
          }

          archive.finalize();
        });

        return NextResponse.json({ success: true, filename: outputName || 'archive.zip' });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    if (action === 'download') {
      const { path: filePath } = body;
      const targetPath = path.join(basePath, filePath);
      
      if (!targetPath.startsWith(basePath)) {
        return NextResponse.json({ error: "Invalid path" }, { status: 403 });
      }

      try {
        const fileBuffer = await fs.readFile(targetPath);
        const fileName = path.basename(targetPath);
        return new Response(fileBuffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          }
        });
      } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    console.error("File POST error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

