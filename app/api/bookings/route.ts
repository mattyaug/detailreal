import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import { NextRequest, NextResponse } from "next/server";
import { getService, priceAddOns } from "@/lib/services";
import { BUSINESS_TIME_ZONE, getAvailableSlots } from "@/lib/schedule";
import { execute, isBookingConflict } from "@/lib/db";

import { sendBookingEmails } from "@/lib/booking-email";

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
  addOns?: unknown;
  utilitiesConfirmed?: boolean;
};

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BookingInput;
    if (clean(body.company)) return NextResponse.json({ ok: true });

    if (body.utilitiesConfirmed !== true) return NextResponse.json({ error: "Confirm access to water and electricity before booking." }, { status: 400 });
    let addOns;
    try { addOns = priceAddOns(body.addOns ?? []); } catch { return NextResponse.json({ error: "Choose valid add-ons." }, { status: 400 }); }

    const customerName = clean(body.customerName, 120);
    const email = clean(body.email, 180).toLowerCase();
    const phone = clean(body.phone, 40);
    const address = clean(body.address, 220);
    const vehicle = clean(body.vehicle, 160);
    const notes = clean(body.notes, 1500);
    const service = getService(clean(body.serviceSlug, 80));
    const startsAt = clean(body.startsAt, 80);

    if (!customerName || ! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || phone.length < 7 || !address || !vehicle || !service || !startsAt) {
      return NextResponse.json({ error: "Complete all required booking fields." }, { status: 400 });
    }

    const start = DateTime.fromISO(startsAt, { setZone: true }).setZone(BUSINESS_TIME_ZONE);
    if (!start.isValid) return NextResponse.json({ error: "Choose a valid appointment time." }, { status: 400 });

    const durationMinutes = service.durationMinutes + addOns.durationMinutes;
    const priceCents = service.startingPriceCents + addOns.priceCents;
    const serviceName = service.name + (addOns.summary ? ` + ${addOns.summary}` : "");
    const bookingNotes = `${notes}${notes ? "\n\n" : ""}Water and electricity access confirmed.${addOns.summary ? `\nAdd-ons: ${addOns.summary}` : ""}`;
    const localDate = start.toFormat("yyyy-MM-dd");
    const available = await getAvailableSlots(localDate, durationMinutes);
    const stillAvailable = available.some((slot) => slot.value === start.toISO());
    if (!stillAvailable) {
      return NextResponse.json({ error: "That time was just taken. Choose another available slot." }, { status: 409 });
    }

    const id = randomUUID();
    const end = start.plus({ minutes: durationMinutes });

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
          service.slug, serviceName, priceCents, durationMinutes,
          start.toUTC().toISO(), end.toUTC().toISO(), bookingNotes,
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

    let emailAccepted = false;
    try {
      const delivery = await sendBookingEmails({
        id, email,
        serviceName, startsAt: start.toUTC().toISO()!,
        durationMinutes,
      });
      emailAccepted = delivery.customer;
    } catch {
      console.error("Booking saved but email notification failed", { bookingId: id });
    }

    return NextResponse.json({
      ok: true,
      emailAccepted,
      booking: { id, serviceName, startsAt: start.toISO() },
    }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "We could not create the booking. Please try again." }, { status: 500 });
  }
}
