import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { executeBatch, query } from "@/lib/db";
import { validBlockedHours } from "@/lib/hour-blocks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HoursInput = { weekday?: number; start_time?: string; end_time?: string; is_enabled?: boolean; blocked_hours?: number[] };

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
    const blocks = await query<{ weekday: number; hour: number }>(
      `SELECT weekday, hour FROM weekly_blocked_hours ORDER BY hour`,
    );
    return NextResponse.json({
      availability: result.rows.map((row: any) => ({ ...row, is_enabled: Boolean(row.is_enabled), blocked_hours: blocks.rows.filter((block) => block.weekday === row.weekday).map((block) => block.hour) })),
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
    if (rows.length !== 7 || rows.some((row) => !row) || new Set(rows.map((row) => row.weekday)).size !== 7) return NextResponse.json({ error: "All seven weekdays are required." }, { status: 400 });

    for (const row of rows) {
      if (!validBlockedHours(row.blocked_hours)) return NextResponse.json({ error: "Choose valid individual hours for each day." }, { status: 400 });
      if (!Number.isInteger(row.weekday) || (row.weekday as number) < 0 || (row.weekday as number) > 6 || !validTime(row.start_time) || !validTime(row.end_time) || typeof row.is_enabled !== "boolean") {
        return NextResponse.json({ error: "One or more working-hour values are invalid." }, { status: 400 });
      }
      if (row.is_enabled && row.start_time! >= row.end_time!) {
        return NextResponse.json({ error: "Opening time must be earlier than closing time." }, { status: 400 });
      }
    }

    await executeBatch(rows.flatMap((row) => [{
          sql:
          `INSERT INTO availability (weekday, start_time, end_time, is_enabled, updated_at)
           VALUES (?,?,?,?,CURRENT_TIMESTAMP)
           ON CONFLICT (weekday) DO UPDATE SET
             start_time = EXCLUDED.start_time,
             end_time = EXCLUDED.end_time,
             is_enabled = EXCLUDED.is_enabled,
             updated_at = CURRENT_TIMESTAMP`,
          params: [row.weekday, row.start_time, row.end_time, row.is_enabled ? 1 : 0],
        }, {
          sql: `DELETE FROM weekly_blocked_hours WHERE weekday = ?`, params: [row.weekday],
        }, ...row.blocked_hours!.map((hour) => ({
          sql: `INSERT INTO weekly_blocked_hours (weekday, hour) VALUES (?, ?)`, params: [row.weekday, hour],
        }))]));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to save working hours." }, { status: 500 });
  }
}
