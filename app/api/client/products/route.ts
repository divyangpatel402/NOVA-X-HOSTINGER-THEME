import { NextResponse } from 'next/server';
import { readDB, DEFAULT_STORE_PRODUCTS, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDB();
    if (!db.settings) db.settings = {};
    if (!db.settings.storeProducts || !Array.isArray(db.settings.storeProducts)) {
      db.settings.storeProducts = [...DEFAULT_STORE_PRODUCTS];
      writeDB(db);
    }
    return NextResponse.json({ success: true, products: db.settings.storeProducts });
  } catch (err) {
    console.error("Client Products GET Error:", err);
    return NextResponse.json({ success: true, products: DEFAULT_STORE_PRODUCTS });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = readDB();
    if (!db.settings) db.settings = {};
    if (!db.settings.storeProducts) db.settings.storeProducts = [...DEFAULT_STORE_PRODUCTS];

    if (body.products && Array.isArray(body.products)) {
      db.settings.storeProducts = body.products;
      writeDB(db);
      return NextResponse.json({ success: true, products: db.settings.storeProducts });
    }

    const { id, name, category, price, ram, cpu, storage, eggId, allowedEggs, description, features, color, nodeId } = body;
    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }

    const newProd = {
      id: id || "prod_" + Date.now().toString(36),
      name,
      category: category || "🎮 Game Servers",
      price: Number(price) || 499,
      ram: Number(ram) || 4096,
      cpu: Number(cpu) || 200,
      storage: Number(storage) || 30,
      eggId: eggId || "minecraft_java",
      allowedEggs: Array.isArray(allowedEggs) ? allowedEggs : [],
      nodeId: nodeId || "all",
      description: description || "Custom high performance server instance.",
      features: Array.isArray(features) ? features : ["Instant Automated Provisioning", "High Speed NVMe Storage", "1 Gbps DDoS Protection", "Full Console & SFTP Access"],
      color: color || "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-400"
    };

    const existingIdx = db.settings.storeProducts.findIndex((p: any) => p.id === newProd.id);
    if (existingIdx >= 0) {
      db.settings.storeProducts[existingIdx] = { ...db.settings.storeProducts[existingIdx], ...newProd };
    } else {
      // User requested: "When we add a new product, the default 512MB ones should be removed, only the new one stays"
      // Filter out all default products (which don't start with 'prod_') when a custom product is added.
      db.settings.storeProducts = db.settings.storeProducts.filter((p: any) => p.id && p.id.startsWith("prod_"));
      db.settings.storeProducts.push(newProd);
    }
    writeDB(db);

    return NextResponse.json({ success: true, product: newProd, products: db.settings.storeProducts });
  } catch (err) {
    console.error("Client Products POST Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export { POST as PUT };

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const db = readDB();
    if (db.settings?.storeProducts) {
      db.settings.storeProducts = db.settings.storeProducts.filter((p: any) => p.id !== id);
      writeDB(db);
    }
    return NextResponse.json({ success: true, deleted: id, products: db.settings?.storeProducts || [] });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
