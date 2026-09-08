import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { execute, query, isBookingConflict } from "@/lib/db";
import { bookingListQuery, BOOKING_PAGE_SIZE } from "@/lib/booking-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function authorized() {
  return Boolean(await getAdminSession());
}

export async function GET(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const archive = request.nextUrl.searchParams.get("view") === "archive";
    const offset = Number(request.nextUrl.searchParams.get("offset") || 0);
    if (!Number.isSafeInteger(offset) || offset < 0) return NextResponse.json({ error: "Invalid page." }, { status: 400 });
    const { sql, params } = bookingListQuery(archive, offset);
    const result = await query(sql, params);
    return NextResponse.json({ bookings: result.rows.slice(0, BOOKING_PAGE_SIZE), hasMore: result.rows.length > BOOKING_PAGE_SIZE });
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
