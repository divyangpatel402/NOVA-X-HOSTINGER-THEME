import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, email, username, firstName, lastName, country, zip, address, currentPassword, newPassword } = body;

    if (!email && !username) {
      return NextResponse.json({ error: "Email or username required" }, { status: 400 });
    }

    const db = readDB();
    if (!db.users) db.users = [];

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanUser = (username || '').trim().toLowerCase();

    const userIndex = db.users.findIndex((u: any) => 
      (cleanEmail && u.email?.toLowerCase() === cleanEmail) || 
      (cleanUser && u.username?.toLowerCase() === cleanUser)
    );

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = db.users[userIndex];

    if (action === 'update_details') {
      user.firstName = firstName || user.firstName || '';
      user.lastName = lastName || user.lastName || '';
      user.country = country || user.country || '';
      user.zip = zip || user.zip || '';
      user.address = address || user.address || '';
      
      // Log activity
      if (!db.settings) db.settings = {};
      if (!db.settings.activityLogs) db.settings.activityLogs = [];
      db.settings.activityLogs.unshift({
        id: "log_" + Date.now().toString(36),
        userEmail: user.email,
        username: user.username,
        action: "account.update_details",
        timestamp: Date.now(),
        ip: req.headers.get('x-forwarded-for') || "127.0.0.1",
        device: "Desktop Monitor"
      });

      writeDB(db);
      return NextResponse.json({ success: true, user });
    }

    if (action === 'update_password') {
      if (user.password !== currentPassword) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
      }
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      user.password = newPassword;

      // Log activity
      if (!db.settings) db.settings = {};
      if (!db.settings.activityLogs) db.settings.activityLogs = [];
      db.settings.activityLogs.unshift({
        id: "log_" + Date.now().toString(36),
        userEmail: user.email,
        username: user.username,
        action: "account.update_password",
        timestamp: Date.now(),
        ip: req.headers.get('x-forwarded-for') || "127.0.0.1",
        device: "Desktop Monitor"
      });

      writeDB(db);
      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    if (action === 'toggle_2fa') {
      user.twoFactorEnabled = !user.twoFactorEnabled;

      if (!db.settings) db.settings = {};
      if (!db.settings.activityLogs) db.settings.activityLogs = [];
      db.settings.activityLogs.unshift({
        id: "log_" + Date.now().toString(36),
        userEmail: user.email,
        username: user.username,
        action: user.twoFactorEnabled ? "account.2fa_enabled" : "account.2fa_disabled",
        timestamp: Date.now(),
        ip: req.headers.get('x-forwarded-for') || "127.0.0.1",
        device: "Desktop Monitor"
      });

      writeDB(db);
      return NextResponse.json({ success: true, twoFactorEnabled: user.twoFactorEnabled });
    }

    if (action === 'get_profile') {
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Client Account API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
