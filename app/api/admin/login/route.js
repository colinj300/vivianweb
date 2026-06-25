import { NextResponse } from "next/server";
import { passwordMatches, sessionToken, ADMIN_COOKIE } from "@/lib/admin";

// POST { password } → set the secure admin session cookie.
export async function POST(req) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "Set ADMIN_PASSWORD on the server to enable the admin panel." },
      { status: 503 }
    );
  }
  const { password } = await req.json().catch(() => ({}));
  if (!passwordMatches(password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  return res;
}

// DELETE → log out (clear the cookie).
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
