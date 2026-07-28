import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendOrderReceivedEmail, sendOrderConfirmation } from '@/lib/email';
import { autoProvisionServerForOrder } from '@/lib/provisioning';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = await params;
  const db = readDB();
  const o = db.orders.find(x => x.orderId === unwrappedParams.id);
  
  if (!o) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (o.status === "PENDING" && o.gatewayOrderId) {
    try {
      const settings = db.settings || {};
      const url = settings.gatewayUrl || process.env.GATEWAY_URL || "https://slice-upi-gateway.novaxsmp-upi.workers.dev";
      const secret = settings.gatewaySecret || process.env.GATEWAY_SECRET || "testsecret123";
      
      const gatewayRes = await fetch(`${url}/api/order/${o.gatewayOrderId}`, {
        headers: { 'Authorization': `Bearer ${secret}` }
      });
      const data = await gatewayRes.json();
      const gStatus = (data.status || '').toString().toUpperCase();
      
      if (gStatus === 'SUCCESS' || gStatus === 'PAID' || gStatus === 'COMPLETED' || gStatus === 'CAPTURED' || data.paid === true) {
        if (!o.paymentVerified) {
          o.paymentVerified = true;
          o.status = "APPROVED";
          try {
            await autoProvisionServerForOrder(o, db);
          } catch (provErr) {
            console.error("Auto provisioning error:", provErr);
          }
          sendOrderReceivedEmail(o);
          sendOrderConfirmation(o);
        }
        writeDB(db);
      } else if (data.status === 'timeout') {
        o.status = "REJECTED";
        writeDB(db);
      }
    } catch (err) {
      console.error("Polling gateway error:", err);
    }
  }

  return NextResponse.json({
    status: o.status,
    paymentVerified: o.paymentVerified,
    order: {
      orderId: o.orderId,
      product: o.product,
      price: o.price,
      timestamp: o.timestamp,
      utr: o.utr
    }
  });
}
