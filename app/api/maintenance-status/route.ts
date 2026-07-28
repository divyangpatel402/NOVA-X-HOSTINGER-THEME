import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function GET() {
  const db = readDB();
  return NextResponse.json({
    maintenanceMode: db.settings?.maintenanceMode || false,
    maintenanceMessage: db.settings?.maintenanceMessage || "We are currently performing maintenance. Please check back soon!"
  });
}
export const dynamic = 'force-dynamic';
