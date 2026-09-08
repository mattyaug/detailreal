import { DateTime } from "luxon";

export const BUSINESS_TIME_ZONE = "America/Chicago";

export function isFutureBookingDate(date: string, now = DateTime.now()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const day = DateTime.fromISO(date, { zone: BUSINESS_TIME_ZONE });
  return day.isValid && day.startOf("day") > now.setZone(BUSINESS_TIME_ZONE).startOf("day");
}

export function bookableDates(now = DateTime.now()) {
  const tomorrow = now.setZone(BUSINESS_TIME_ZONE).startOf("day").plus({ days: 1 });
  return Array.from({ length: 90 }, (_, index) => {
    const day = tomorrow.plus({ days: index });
    const formatted = day.setLocale("en-US").toFormat("cccc, LLLL d");
    return { value: day.toISODate()!, label: index === 0 ? `Tomorrow — ${formatted}` : formatted };
  });
}
