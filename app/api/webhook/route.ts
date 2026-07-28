import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendOrderReceivedEmail, sendOrderConfirmation } from '@/lib/email';
import { autoProvisionServerForOrder } from '@/lib/provisioning';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const secret = req.headers.get("x-webhook-secret");
    if (secret && secret !== (process.env.GATEWAY_SECRET || "testsecret123")) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { event, order } = body;
    const eventLower = (event || '').toLowerCase();

    if ((eventLower === "order.success" || eventLower === "order.paid" || eventLower === "payment.success" || eventLower === "payment.captured") && order) {
      const db = readDB();
      const matchingOrder = db.orders.find(o => 
        o.gatewayOrderId === order.order_id || 
        o.gatewayOrderId === order.orderId ||
        o.orderId === order.orderId ||
        o.orderId === order.order_id ||
        (o.status === "PENDING" && o.slottedAmount === order.amount)
      );
      
      if (matchingOrder) {
        matchingOrder.paymentVerified = true;
        matchingOrder.status = "APPROVED";
        try {
          await autoProvisionServerForOrder(matchingOrder, db);
        } catch (provErr) {
          console.error("Webhook provisioning error:", provErr);
        }
        sendOrderReceivedEmail(matchingOrder);
        sendOrderConfirmation(matchingOrder);
        writeDB(db);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
