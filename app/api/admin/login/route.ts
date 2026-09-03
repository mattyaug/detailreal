import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions, createAdminSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const passwordHashB64 = process.env.ADMIN_PASSWORD_HASH_B64;
    const passwordHash = passwordHashB64 ? Buffer.from(passwordHashB64, "base64").toString("utf8") : "";

    if (!adminEmail || !passwordHash) {
      return NextResponse.json({ error: "Owner login is not configured yet." }, { status: 503 });
    }

    const emailMatches = email === adminEmail;
    const passwordMatches = password.length <= 72 && await bcrypt.compare(password, passwordHash);

    if (!emailMatches || !passwordMatches) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE, createAdminSession(adminEmail), adminCookieOptions);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
