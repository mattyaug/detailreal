export function validBlockedHours(value: unknown): value is number[] {
  return Array.isArray(value) && value.length <= 24 &&
    value.every((hour) => Number.isInteger(hour) && hour >= 0 && hour <= 23) &&
    new Set(value).size === value.length;
}

// A blocked hour excludes any appointment that touches its interior,
// including long services or add-ons starting before that hour.
export function overlapsBlockedHour(startMinute: number, endMinute: number, hours: number[]) {
  return hours.some((hour) => startMinute < (hour + 1) * 60 && endMinute > hour * 60);
}
