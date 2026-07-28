import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import { sendOrderConfirmation } from '@/lib/email';
import { autoProvisionServerForOrder } from '@/lib/provisioning';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, password, orderId, deliveryDetails } = body;

    const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

    if (password !== ADMIN_PASS) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 401 });
    }

    const db = readDB();

    if (action === "login") {
      return NextResponse.json({ success: true });
    }

    if (action === "list") {
      return NextResponse.json({ orders: db.orders });
    }

    if (action === "approve") {
      const order = db.orders.find(o => o.orderId === orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      order.status = "APPROVED";
      order.paymentVerified = true;
      if (deliveryDetails) {
        order.deliveryDetails = deliveryDetails;
      }
      await autoProvisionServerForOrder(order, db);
      writeDB(db);

      // Send confirmation email
      await sendOrderConfirmation(order);

      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      const order = db.orders.find(o => o.orderId === orderId);
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      order.status = "REJECTED";
      writeDB(db);

      return NextResponse.json({ success: true });
    }

    if (action === "get_settings") {
      return NextResponse.json({ settings: db.settings || {} });
    }

    if (action === "save_settings") {
      const { settingsData } = body;
      db.settings = {
        ...(db.settings || {}),
        ...settingsData
      };
      writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === "create_coupon") {
      const { coupon } = body;
      const settings = db.settings || {};
      settings.coupons = settings.coupons || [];
      settings.coupons.push({
        code: coupon.code.toUpperCase(),
        discount: Number(coupon.discount),
        maxUses: Number(coupon.maxUses || 0),
        uses: 0
      });
      db.settings = settings;
      writeDB(db);
      return NextResponse.json({ success: true });
    }

    if (action === "delete_coupon") {
      const { code } = body;
      const settings = db.settings || {};
      settings.coupons = settings.coupons || [];
      settings.coupons = settings.coupons.filter((c: any) => c.code.toUpperCase() !== code.toUpperCase());
      db.settings = settings;
      writeDB(db);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Admin API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
