import { NextResponse } from 'next/server';
import { getSftpUser, createSftpUser, resetSftpPassword } from '@/lib/sftp';
import { readDB } from '@/lib/db';
import os from 'os';

export const dynamic = 'force-dynamic';

const getHostIP = () => {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    if (!iface) continue;
    for (const i of iface) {
      if (i.family === 'IPv4' && !i.internal && i.address !== '127.0.0.1') {
        return i.address;
      }
    }
  }
  return '127.0.0.1';
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let user: any = await getSftpUser(id);
    if (!user) {
      user = await createSftpUser(id);
    }

    const db = readDB();
    const server = (db.pteroServers || []).find((s: any) => s.id === id);
    let host = getHostIP();
    
    if (server && server.node) {
      const nodeObj = (db.nodes || []).find((n: any) => n.id === server.node || n.name === server.node);
      if (nodeObj && nodeObj.fqdn && nodeObj.fqdn !== '0.0.0.0' && nodeObj.fqdn !== '127.0.0.1') {
        host = nodeObj.fqdn;
      }
    }
    
    if (host === '127.0.0.1' && db.nodes && db.nodes.length > 0) {
      const firstValidNode = db.nodes.find((n: any) => n.fqdn && n.fqdn !== '0.0.0.0' && n.fqdn !== '127.0.0.1');
      if (firstValidNode) host = firstValidNode.fqdn;
    }

    return NextResponse.json({
      username: user.username,
      password: user.password || user.plainPassword || "••••••••••••••••",
      host,
      port: 2022
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await resetSftpPassword(id);
    return NextResponse.json({
      success: true,
      username: user.username,
      password: user.password
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
