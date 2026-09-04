import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { execute, query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await query(
      `SELECT CAST(id AS TEXT) AS id, blocked_date, reason
       FROM blocked_dates
       WHERE blocked_date >= date('now')
       ORDER BY blocked_date ASC`,
    );
    return NextResponse.json({ blockedDates: result.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load blocked dates." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const date = typeof body.date === "string" ? body.date.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 200) : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Choose a valid date." }, { status: 400 });

    await execute(
      `INSERT INTO blocked_dates (blocked_date, reason)
       VALUES (?, ?)
       ON CONFLICT (blocked_date) DO UPDATE SET reason = EXCLUDED.reason`,
      [date, reason || null],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to block date." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id") || "";
    if (!/^\d+$/.test(id)) return NextResponse.json({ error: "Invalid blocked date." }, { status: 400 });
    await execute(`DELETE FROM blocked_dates WHERE id = ?`, [id]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to remove blocked date." }, { status: 500 });
  }
}
