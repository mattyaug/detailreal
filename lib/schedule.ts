import { DateTime } from "luxon";
import { query } from "@/lib/db";

export const BUSINESS_TIME_ZONE = "America/Chicago";
export const SLOT_STEP_MINUTES = 30;

type AvailabilityRow = {
  weekday: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
};

const DEFAULT_OPEN_TIME = "08:00";
const DEFAULT_CLOSE_TIME = "17:00";

type BookingRow = {
  starts_at: Date;
  ends_at: Date;
};

export async function getAvailableSlots(date: string, durationMinutes: number) {
  const localDate = DateTime.fromISO(date, { zone: BUSINESS_TIME_ZONE });
  if (!localDate.isValid) return [];

  const today = DateTime.now().setZone(BUSINESS_TIME_ZONE).startOf("day");
  if (localDate.startOf("day") < today) return [];

  // Luxon: Monday=1 ... Sunday=7. Database: Sunday=0 ... Saturday=6.
  const weekday = localDate.weekday === 7 ? 0 : localDate.weekday;

  const availabilityResult = await query<AvailabilityRow>(
    `SELECT weekday, start_time::text, end_time::text, is_enabled
     FROM availability
     WHERE weekday = $1
     LIMIT 1`,
    [weekday],
  );

  // Every day is bookable. Keep the stored hours when present, but fall back to
  // a full standard day so a missing or previously-disabled row cannot make the
  // customer-facing scheduler appear empty.
  const hours = availabilityResult.rows[0];
  const startTime = hours?.start_time || DEFAULT_OPEN_TIME;
  const endTime = hours?.end_time || DEFAULT_CLOSE_TIME;

  const blockedResult = await query<{ blocked_date: string }>(
    `SELECT blocked_date::text
     FROM blocked_dates
     WHERE blocked_date = $1::date
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
       AND starts_at < $2
       AND ends_at > $1
     ORDER BY starts_at ASC`,
    [dayStart.toJSDate(), dayEnd.toJSDate()],
  );

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

    const overlaps = bookingsResult.rows.some((booking) => {
      const existingStart = DateTime.fromJSDate(booking.starts_at).toUTC();
      const existingEnd = DateTime.fromJSDate(booking.ends_at).toUTC();
      return slotStartUtc < existingEnd && slotEndUtc > existingStart;
    });

    const leadTimeOk = cursor > now.plus({ hours: 2 });
    if (!overlaps && leadTimeOk) {
      slots.push({
        value: cursor.toISO()!,
        label: cursor.toFormat("h:mm a"),
      });
    }

    cursor = cursor.plus({ minutes: SLOT_STEP_MINUTES });
  }

  return slots;
}
