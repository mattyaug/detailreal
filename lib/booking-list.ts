export const BOOKING_PAGE_SIZE = 50;

export function bookingListQuery(archive: boolean, offset: number, now = new Date().toISOString()) {
  return {
    sql: `SELECT id, customer_name, email, phone, address, vehicle, service_name,
                 starts_at, ends_at, status, notes
          FROM bookings
          WHERE ${archive ? "(status <> 'confirmed' OR ends_at <= ?)" : "status = 'confirmed' AND ends_at > ?"}
          ORDER BY starts_at ${archive ? "DESC" : "ASC"}, id ASC
          LIMIT ? OFFSET ?`,
    params: [now, BOOKING_PAGE_SIZE + 1, offset],
  };
}
