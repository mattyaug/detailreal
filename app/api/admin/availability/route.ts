import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { executeBatch, query } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HoursInput = { weekday?: number; start_time?: string; end_time?: string; is_enabled?: boolean };

function validTime(value: unknown) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function GET() {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await query(
      `SELECT weekday, start_time, end_time, is_enabled
       FROM availability ORDER BY weekday ASC`,
    );
    return NextResponse.json({
      availability: result.rows.map((row: any) => ({ ...row, is_enabled: Boolean(row.is_enabled) })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load hours." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const rows = Array.isArray(body.availability) ? body.availability as HoursInput[] : [];
    if (rows.length !== 7 || new Set(rows.map((row) => row.weekday)).size !== 7) return NextResponse.json({ error: "All seven weekdays are required." }, { status: 400 });

    for (const row of rows) {
      if (!Number.isInteger(row.weekday) || (row.weekday as number) < 0 || (row.weekday as number) > 6 || !validTime(row.start_time) || !validTime(row.end_time) || typeof row.is_enabled !== "boolean") {
        return NextResponse.json({ error: "One or more working-hour values are invalid." }, { status: 400 });
      }
      if (row.is_enabled && row.start_time! >= row.end_time!) {
        return NextResponse.json({ error: "Opening time must be earlier than closing time." }, { status: 400 });
      }
    }

    await executeBatch(rows.map((row) => ({
          sql:
          `INSERT INTO availability (weekday, start_time, end_time, is_enabled, updated_at)
           VALUES (?,?,?,?,CURRENT_TIMESTAMP)
           ON CONFLICT (weekday) DO UPDATE SET
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             is_enabled = EXCLUDED.is_enabled,
             updated_at = CURRENT_TIMESTAMP`,
          params: [row.weekday, row.start_time, row.end_time, row.is_enabled ? 1 : 0],
        })));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save working hours." }, { status: 500 });
  }
}
