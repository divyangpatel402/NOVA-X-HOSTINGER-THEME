import { NextResponse } from 'next/server';
import { readDB, writeDB, newOrderId } from '@/lib/db';
import { initBot, sendNewOrderNotification } from '@/lib/discord-bot';

// Initialize the Discord Bot client on backend load
initBot();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { product, price, email, clientConfig, deliveryDetails } = body;

    if (!product || price === undefined || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = readDB();
    const orderId = newOrderId();

    const order = {
      orderId,
      product,
      price: Number(price),
      user: { email },
      status: 'PENDING',
      gatewayOrderId: undefined,
      slottedAmount: undefined,
      clientConfig: clientConfig || {},
      deliveryDetails,
      timestamp: Date.now()
    };

    db.orders.unshift(order);
    writeDB(db);

    // Send Discord Bot Notification
    await sendNewOrderNotification(order);

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    console.error('Checkout API Error:', err);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
