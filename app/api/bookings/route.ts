import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";
import { getService } from "@/lib/services";
import { BUSINESS_TIME_ZONE, getAvailableSlots } from "@/lib/schedule";
import { execute, isBookingConflict } from "@/lib/db";

export const runtime = "nodejs";

type BookingInput = {
  customerName?: string;
  email?: string;
  phone?: string;
  address?: string;
  vehicle?: string;
  notes?: string;
  company?: string;
  serviceSlug?: string;
  startsAt?: string;
};

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingInput;
    if (clean(body.company)) return NextResponse.json({ ok: true });

    const customerName = clean(body.customerName, 120);
    const email = clean(body.email, 180).toLowerCase();
    const phone = clean(body.phone, 40);
    const address = clean(body.address, 220);
    const vehicle = clean(body.vehicle, 160);
    const notes = clean(body.notes, 1500);
    const service = getService(clean(body.serviceSlug, 80));
    const startsAt = clean(body.startsAt, 80);

    if (!customerName || !email.includes("@") || phone.length < 7 || !address || !vehicle || !service || !startsAt) {
      return NextResponse.json({ error: "Complete all required booking fields." }, { status: 400 });
    }

    const start = DateTime.fromISO(startsAt, { setZone: true }).setZone(BUSINESS_TIME_ZONE);
    if (!start.isValid) return NextResponse.json({ error: "Choose a valid appointment time." }, { status: 400 });

    const localDate = start.toFormat("yyyy-MM-dd");
    const available = await getAvailableSlots(localDate, service.durationMinutes);
    const stillAvailable = available.some((slot) => slot.value === start.toISO());
    if (!stillAvailable) {
      return NextResponse.json({ error: "That time was just taken. Choose another available slot." }, { status: 409 });
    }

    const id = randomUUID();
    const end = start.plus({ minutes: service.durationMinutes });

    try {
      const result = await execute(
        `INSERT INTO bookings (
          id, customer_name, email, phone, address, city, vehicle,
          service_slug, service_name, price_cents, duration_minutes,
          starts_at, ends_at, status, notes
        )
        SELECT ?,?,?,?,?,'Portland',?,?,?,?,?,?,?,'confirmed',?
        WHERE NOT EXISTS (
          SELECT 1 FROM bookings
          WHERE status <> 'cancelled' AND starts_at < ? AND ends_at > ?
        )`,
        [
          id, customerName, email, phone, address, vehicle,
          service.slug, service.name, service.startingPriceCents, service.durationMinutes,
          start.toUTC().toISO(), end.toUTC().toISO(), notes || null,
          end.toUTC().toISO(), start.toUTC().toISO(),
        ],
      );
      if (!result.rowCount) {
        return NextResponse.json({ error: "That time was just taken. Choose another available slot." }, { status: 409 });
      }
    } catch (error: unknown) {
      if (isBookingConflict(error)) {
        return NextResponse.json({ error: "That time was just taken. Choose another available slot." }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({
      ok: true,
      booking: { id, serviceName: service.name, startsAt: start.toISO() },
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "We could not create the booking. Please try again." }, { status: 500 });
  }
}
