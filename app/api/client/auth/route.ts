import { NextResponse } from 'next/server';
import { readDB, writeDB } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, username, email, password, emailOrUsername } = body;

    const db = readDB();
    if (!db.users) {
      db.users = [];
    }

    if (action === "register") {
      if (!username || !email || !password) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const normalizedUsername = username.toLowerCase().trim();

      // Check if user already exists
      const existingUser = db.users.find((u: any) => u.email.toLowerCase() === normalizedEmail || u.username.toLowerCase() === normalizedUsername);
      if (existingUser) {
        return NextResponse.json({ error: "Username or Email already registered" }, { status: 400 });
      }

      const newUser = {
        username: normalizedUsername,
        email: normalizedEmail,
        password: password, // For simplicity of setup
        timestamp: Date.now()
      };

      db.users.push(newUser);
      writeDB(db);

      return NextResponse.json({ success: true, user: { username: newUser.username, email: newUser.email } });
    }

    if (action === "login") {
      if (!emailOrUsername || !password) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      const query = emailOrUsername.toLowerCase().trim();
      const user = db.users.find((u: any) => u.email.toLowerCase() === query || u.username.toLowerCase() === query);

      if (!user || user.password !== password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      return NextResponse.json({ success: true, user: { username: user.username, email: user.email, role: user.role || 'user' } });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Client Auth API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
