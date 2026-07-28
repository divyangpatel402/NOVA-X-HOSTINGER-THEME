import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = readDB();
    const settings = db.settings || {};
    return NextResponse.json({
      success: true,
      settings: {
        panelName: settings.panelName || "Nova Hosting Panel",
        panelLogo: settings.panelLogo || "",
        panelBackgroundImage: settings.panelBackgroundImage || "",
        panelBackgroundBlur: settings.panelBackgroundBlur !== undefined ? settings.panelBackgroundBlur : true,
        enableTutorial: settings.enableTutorial !== undefined ? settings.enableTutorial : true,
        enableLoginAnimation: settings.enableLoginAnimation !== undefined ? settings.enableLoginAnimation : true,
        companyName: settings.companyName || "Nova Hosting",
        require2FA: settings.require2FA || "Not Required"
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const db = readDB();
    if (!db.settings) db.settings = {};

    const {
      panelName,
      panelLogo,
      panelBackgroundImage,
      panelBackgroundBlur,
      enableTutorial,
      enableLoginAnimation,
      companyName,
      require2FA
    } = body;

    if (panelName !== undefined) db.settings.panelName = panelName;
    if (panelLogo !== undefined) db.settings.panelLogo = panelLogo;
    if (panelBackgroundImage !== undefined) db.settings.panelBackgroundImage = panelBackgroundImage;
    if (panelBackgroundBlur !== undefined) db.settings.panelBackgroundBlur = panelBackgroundBlur;
    if (enableTutorial !== undefined) db.settings.enableTutorial = enableTutorial;
    if (enableLoginAnimation !== undefined) db.settings.enableLoginAnimation = enableLoginAnimation;
    if (companyName !== undefined) db.settings.companyName = companyName;
    if (require2FA !== undefined) db.settings.require2FA = require2FA;

    writeDB(db);

    return NextResponse.json({ success: true, settings: db.settings });
  } catch (err) {
    console.error("Settings update error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
