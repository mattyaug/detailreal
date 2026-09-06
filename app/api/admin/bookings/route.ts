import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { execute, query, isBookingConflict } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorized() {
  return Boolean(await getAdminSession());
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await query(
      `SELECT id, customer_name, email, phone, address, vehicle, service_name,
              starts_at, ends_at, status, notes
       FROM bookings
       WHERE starts_at >= strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')
       ORDER BY starts_at ASC
       LIMIT 150`,
    );
    return NextResponse.json({ bookings: result.rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to load bookings." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    const status = typeof body.status === "string" ? body.status : "";
    if (!id || !["confirmed", "completed", "cancelled"].includes(status)) {
      return NextResponse.json({ error: "Invalid booking update." }, { status: 400 });
    }

    try {
      const result = await execute(
        `UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [status, id],
      );
      if (!result.rowCount) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    } catch (error: unknown) {
      if (isBookingConflict(error)) {
        return NextResponse.json({ error: "This booking overlaps another active appointment and cannot be restored." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Unable to update booking." }, { status: 500 });
  }
}
