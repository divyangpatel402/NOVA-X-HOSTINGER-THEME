import { NextResponse } from 'next/server';
import { readDB, writeDB, Allocation } from '@/lib/db';

export const dynamic = 'force-dynamic';


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: nodeId } = await params;
    const db = readDB();
    const allocations = db.allocations?.filter(a => a.nodeId === nodeId) || [];
    return NextResponse.json({ success: true, allocations });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: nodeId } = await params;
    const body = await req.json();
    const db = readDB();
    if (!db.allocations) db.allocations = [];
    const { ip, alias, ports } = body;
    
    // Parse ports (e.g. "25565" or "25565-2599" or "25565,25566")
    const newAllocations: Allocation[] = [];
    const portParts = ports.split(/[, ]+/);
    
    for (const part of portParts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let p = start; p <= end; p++) {
            newAllocations.push({
              id: "alloc_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5),
              nodeId,
              ip: ip || '0.0.0.0',
              alias: alias || '',
              port: p,
              assignedToServerId: null
            });
          }
        }
      } else {
        const p = Number(part);
        if (!isNaN(p)) {
          newAllocations.push({
            id: "alloc_" + Date.now().toString(36) + "_" + Math.random().toString(36).substr(2, 5),
            nodeId,
            ip: ip || '0.0.0.0',
            alias: alias || '',
            port: p,
            assignedToServerId: null
          });
        }
      }
    }

    db.allocations.push(...newAllocations);
    writeDB(db);

    return NextResponse.json({ success: true, message: `Created ${newAllocations.length} allocations` });
  } catch (err) {
    console.error("Allocation API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: nodeId } = await params;
    const body = await req.json();
    const db = readDB();
    if (!db.allocations) db.allocations = [];

    const initialCount = db.allocations.length;

    if (body.deleteAllUnassigned) {
      db.allocations = db.allocations.filter(a => !(a.nodeId === nodeId && !a.assignedToServerId));
    } else if (body.allocationIds && Array.isArray(body.allocationIds)) {
      db.allocations = db.allocations.filter(a => !(a.nodeId === nodeId && body.allocationIds.includes(a.id)));
    }

    const deletedCount = initialCount - db.allocations.length;
    writeDB(db);

    return NextResponse.json({ success: true, deletedCount });
  } catch (err) {
    console.error("Allocation Delete API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
