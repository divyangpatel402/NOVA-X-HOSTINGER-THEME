import { NextResponse } from 'next/server';
import { readDB } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const db = readDB();
    const clientOrders = db.orders.filter(
      (o: any) => o.user && o.user.email.toLowerCase() === email.toLowerCase()
    );

    return NextResponse.json({ success: true, orders: clientOrders });
  } catch (err) {
    console.error("Client Orders API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
