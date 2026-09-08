import { DateTime } from "luxon";
import { query } from "@/lib/db";
import { overlapsBlockedHour } from "@/lib/hour-blocks";
import { BUSINESS_TIME_ZONE, isFutureBookingDate } from "@/lib/booking-dates";

export { BUSINESS_TIME_ZONE } from "@/lib/booking-dates";
export const SLOT_STEP_MINUTES = 30;

type AvailabilityRow = {
  weekday: number;
  start_time: string;
  end_time: string;
  is_enabled: number;
};

const DEFAULT_OPEN_TIME = "08:00";
const DEFAULT_CLOSE_TIME = "17:00";

type BookingRow = {
  starts_at: string;
  ends_at: string;
};

export async function getAvailableSlots(date: string, durationMinutes: number) {
  const localDate = DateTime.fromISO(date, { zone: BUSINESS_TIME_ZONE });
  if (!isFutureBookingDate(date)) return [];

  // Luxon: Monday=1 ... Sunday=7. Database: Sunday=0 ... Saturday=6.
  const weekday = localDate.weekday === 7 ? 0 : localDate.weekday;

  let startTime = DEFAULT_OPEN_TIME;
  let endTime = DEFAULT_CLOSE_TIME;
  let existingBookings: BookingRow[] = [];
  let blockedHours: number[] = [];

  {
    const availabilityResult = await query<AvailabilityRow>(
      `SELECT weekday, start_time, end_time, is_enabled
       FROM availability
       WHERE weekday = ?
       LIMIT 1`,
      [weekday],
    );

    const hours = availabilityResult.rows[0];
    if (!hours || !hours.is_enabled) return [];
    startTime = hours?.start_time || DEFAULT_OPEN_TIME;
    endTime = hours?.end_time || DEFAULT_CLOSE_TIME;
    const hourBlocks = await query<{ hour: number }>(
      `SELECT hour FROM weekly_blocked_hours WHERE weekday = ?`, [weekday],
    );
    blockedHours = hourBlocks.rows.map((row) => row.hour);

    const blockedResult = await query<{ blocked_date: string }>(
      `SELECT blocked_date
       FROM blocked_dates
       WHERE blocked_date = ?
       LIMIT 1`,
      [date],
    );
    if (blockedResult.rowCount) return [];

    const dayStart = localDate.startOf("day").toUTC();
    const dayEnd = localDate.endOf("day").toUTC();
    const bookingsResult = await query<BookingRow>(
      `SELECT starts_at, ends_at
       FROM bookings
       WHERE status <> 'cancelled'
         AND starts_at < ?
         AND ends_at > ?
       ORDER BY starts_at ASC`,
      [dayEnd.toISO(), dayStart.toISO()],
    );
    existingBookings = bookingsResult.rows;
  }

  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  let cursor = localDate.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
  const close = localDate.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
  const now = DateTime.now().setZone(BUSINESS_TIME_ZONE);
  const slots: { value: string; label: string }[] = [];

  while (cursor.plus({ minutes: durationMinutes }) <= close) {
    const slotEnd = cursor.plus({ minutes: durationMinutes });
    const slotStartUtc = cursor.toUTC();
    const slotEndUtc = slotEnd.toUTC();

    const overlaps = existingBookings.some((booking) => {
      const existingStart = DateTime.fromISO(booking.starts_at, { setZone: true }).toUTC();
      const existingEnd = DateTime.fromISO(booking.ends_at, { setZone: true }).toUTC();
      return slotStartUtc < existingEnd && slotEndUtc > existingStart;
    });

    const leadTimeOk = cursor > now.plus({ hours: 2 });
    const hourBlocked = overlapsBlockedHour(cursor.hour * 60 + cursor.minute, slotEnd.hour * 60 + slotEnd.minute, blockedHours);
    if (!overlaps && !hourBlocked && leadTimeOk) {
      slots.push({
        value: cursor.toISO()!,
        label: cursor.toFormat("h:mm a"),
      });
    }

    cursor = cursor.plus({ minutes: SLOT_STEP_MINUTES });
  }

  return slots;
}
