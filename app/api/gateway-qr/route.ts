import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';
import QRCode from 'qrcode';

export async function POST(req: Request) {
  try {
    const { orderId, couponCode } = await req.json();
    const db = readDB();
    const order = db.orders.find(o => o.orderId === orderId);

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Get settings from DB or fallback to environment variables
    const settings = db.settings || {};
    const payeeName = settings.payeeName || process.env.PAYEE_NAME || "NOVA X Web Services";
    const upiId = settings.upiId || process.env.UPI_ID || "novaxsto@slc";
    const url = settings.gatewayUrl || process.env.GATEWAY_URL || "https://slice-upi-gateway.novaxsmp-upi.workers.dev";
    const secret = settings.gatewaySecret || process.env.GATEWAY_SECRET || "testsecret123";

    // Validate and apply coupon
    const activeCouponCode = couponCode || order.couponCode;
    let finalPrice = typeof order.price === 'string' ? parseFloat(order.price.replace(/[^\d.]/g, '')) : order.price;
    let couponApplied = false;
    let couponError = "";
    if (activeCouponCode) {
      const coupon = settings.coupons?.find((c: any) => c.code.toUpperCase() === activeCouponCode.toUpperCase());
      if (coupon) {
        if (!coupon.maxUses || coupon.uses < coupon.maxUses || activeCouponCode === order.couponCode) {
          const discountPercent = coupon.discount;
          finalPrice = Math.round(finalPrice * (1 - discountPercent / 100));
          
          // Increment uses count if this coupon is newly applied to the order
          if (order.couponCode !== activeCouponCode.toUpperCase()) {
            coupon.uses = (coupon.uses || 0) + 1;
          }
          
          order.couponCode = activeCouponCode.toUpperCase();
          order.discount = discountPercent;
          order.originalPrice = typeof order.price === 'string' ? parseFloat(order.price.replace(/[^\d.]/g, '')) : order.price;
          writeDB(db);
          couponApplied = true;
        } else {
          couponError = "Coupon use limit reached";
        }
      } else {
        couponError = "Invalid coupon code";
      }
    }

    const STORE = { payeeName, upiId };

    if (!url || !secret) {
      const upi = `upi://pay?pa=${STORE.upiId}&pn=${encodeURIComponent(STORE.payeeName)}&am=${finalPrice}&cu=INR&tn=${order.orderId}`;
      const qr = await QRCode.toDataURL(upi);
      return NextResponse.json({
        qr,
        upi,
        amount: finalPrice,
        couponApplied,
        couponError,
        couponCode: order.couponCode || null,
        discount: order.discount || 0
      });
    }

    if (order.gatewayOrderId && order.slottedAmount && order.upiIntent && order.lastFinalPrice === finalPrice) {
      const qr = await QRCode.toDataURL(order.upiIntent);
      return NextResponse.json({
        qr,
        upi: order.upiIntent,
        amount: order.slottedAmount,
        couponApplied: !!order.couponCode,
        couponError: "",
        couponCode: order.couponCode || null,
        discount: order.discount || 0
      });
    }

    const gatewayRes = await fetch(`${url}/api/create-order`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount: finalPrice, orderId: order.orderId })
    });
    
    const gatewayData = await gatewayRes.json();
    if (gatewayData.error) throw new Error(gatewayData.error);
    
    let intent = gatewayData.upiIntent;
    intent = intent.replace(/pa=[^&]+/, "pa=" + STORE.upiId);
    intent = intent.replace(/pn=[^&]+/, "pn=" + encodeURIComponent(STORE.payeeName));
    
    order.gatewayOrderId = gatewayData.orderId;
    order.slottedAmount = gatewayData.amount;
    order.upiIntent = intent;
    order.lastFinalPrice = finalPrice;
    
    writeDB(db);

    const qr = await QRCode.toDataURL(intent);
    return NextResponse.json({
      qr,
      upi: intent,
      amount: gatewayData.amount,
      couponApplied,
      couponError,
      couponCode: order.couponCode || null,
      discount: order.discount || 0
    });
  } catch (err) {
    console.error("Gateway error:", err);
    return NextResponse.json({ error: "Failed to generate QR via Gateway" }, { status: 500 });
  }
}
