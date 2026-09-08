"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Booking = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  vehicle: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "completed" | "cancelled";
  notes: string | null;
};

type Hours = {
  weekday: number;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
  blocked_hours: number[];
};

type BlockedDate = { id: string; blocked_date: string; reason: string | null };

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function AdminDashboard({ ownerEmail }: { ownerEmail: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [view, setView] = useState<"upcoming" | "archive">("upcoming");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [hours, setHours] = useState<Hours[]>([]);
  const [blocked, setBlocked] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (replaceHours = false) => {
    setLoading(true);
    setError("");
    setBookings([]);
    setHasMore(false);
    try {
      const [bookingsResponse, availabilityResponse, blockedResponse] = await Promise.all([
        fetch(`/api/admin/bookings?view=${view}&offset=${offset}`, { cache: "no-store" }),
        fetch("/api/admin/availability", { cache: "no-store" }),
        fetch("/api/admin/blocked", { cache: "no-store" }),
      ]);
      if ([bookingsResponse, availabilityResponse, blockedResponse].some((r) => r.status === 401)) {
        window.location.href = "/admin/login";
        return;
      }
      const [bookingsData, availabilityData, blockedData] = await Promise.all([
        bookingsResponse.json(), availabilityResponse.json(), blockedResponse.json(),
      ]);
      if (!bookingsResponse.ok || !availabilityResponse.ok || !blockedResponse.ok) {
        throw new Error(bookingsData.error || availabilityData.error || blockedData.error || "Could not load the dashboard.");
      }
      setBookings(bookingsData.bookings || []);
      setHasMore(Boolean(bookingsData.hasMore));
      setHours((current) => !replaceHours && current.length ? current : availabilityData.availability || []);
      setBlocked(blockedData.blockedDates || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, [view, offset]);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: Booking["status"]) {
    setMessage(""); setError("");
    const response = await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to update booking.");
    setMessage("Booking updated.");
    await load();
  }

  function updateHour(weekday: number, field: keyof Hours, value: string | boolean | number | number[]) {
    setHours((current) => current.map((row) => row.weekday === weekday ? { ...row, [field]: value } : row));
  }

  async function saveHours() {
    setMessage(""); setError("");
    const response = await fetch("/api/admin/availability", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availability: hours }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to save hours.");
    setMessage("Weekly hours saved.");
    await load();
  }

  async function addBlockedDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(""); setError("");
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/blocked", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: form.get("date"), reason: form.get("reason") }),
    });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to block date.");
    formElement.reset();
    setMessage("Date blocked.");
    await load();
  }

  async function removeBlockedDate(id: string) {
    setMessage(""); setError("");
    const response = await fetch(`/api/admin/blocked?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) return setError(data.error || "Unable to remove blocked date.");
    setMessage("Blocked date removed.");
    await load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <>
      <header className="admin-topbar">
        <div className="admin-shell admin-topbar-inner">
          <div className="brand"><img className="brand-logo" src="/nueces-detail-logo.png" alt="Nueces Detail" width={72} height={72} /><span>Nueces Detail · Scheduling</span></div>
          <nav><a className="small-button" href="/" target="_blank">View website</a><button className="small-button" onClick={logout}>Sign out</button></nav>
        </div>
      </header>
      <main className="admin-main">
        <div className="admin-shell">
          <div className="admin-heading">
            <div><span className="eyebrow">Owner dashboard</span><h1>Schedule control</h1><p>Signed in as {ownerEmail}</p></div>
            <button className="button button-small" disabled={loading} onClick={() => load(true)}>Refresh</button>
          </div>
          {message && <div className="success-box">{message}</div>}
          {error && <div className="error-box">{error}</div>}
          {loading ? <div className="info-box">Loading schedule…</div> : (
            <div className="admin-grid">
              <section className="admin-card">
                <div className="booking-row-actions" aria-label="Appointment views">
                  <button className="small-button" aria-pressed={view === "upcoming"} onClick={() => { setView("upcoming"); setOffset(0); }}>Upcoming bookings</button>
                  <button className="small-button" aria-pressed={view === "archive"} onClick={() => { setView("archive"); setOffset(0); }}>Appointment archive</button>
                </div>
                <h2>{view === "archive" ? "Appointment archive" : "Upcoming bookings"}</h2>
                {view === "archive" && <p>All completed, cancelled, and past appointments, newest first. Past appointments keep their recorded status until you update it.</p>}
                <div className="booking-list">
                  {bookings.length === 0 && <div className="info-box">{view === "archive" ? "No archived appointments on this page." : "No upcoming bookings on this page."}</div>}
                  {bookings.map((booking) => (
                    <article className="booking-row" key={booking.id}>
                      <div className="booking-row-head">
                        <div>
                          <h3>{booking.customer_name} • {booking.service_name}</h3>
                          <p><strong>{new Date(booking.starts_at).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" })}</strong></p>
                          <p>{booking.vehicle} • {booking.address}</p>
                          <p><a href={`tel:${booking.phone}`}>{booking.phone}</a> • <a href={`mailto:${booking.email}`}>{booking.email}</a></p>
                          {booking.notes && <p>Notes: {booking.notes}</p>}
                        </div>
                        <span className="status-pill">{booking.status}</span>
                      </div>
                      <div className="booking-row-actions">
                        {booking.status !== "completed" && <button className="small-button" onClick={() => updateStatus(booking.id, "completed")}>Mark completed</button>}
                        {booking.status === "cancelled" ? <button className="small-button" onClick={() => updateStatus(booking.id, "confirmed")}>Restore</button> : <button className="small-button danger" onClick={() => updateStatus(booking.id, "cancelled")}>Cancel booking</button>}
                      </div>
                    </article>
                  ))}
                </div>
                <div className="booking-row-actions">
                  {offset > 0 && <button className="small-button" onClick={() => setOffset(Math.max(0, offset - 50))}>Previous page</button>}
                  {hasMore && <button className="small-button" onClick={() => setOffset(offset + 50)}>Next page</button>}
                </div>
              </section>

              <div style={{ display: "grid", gap: 20 }}>
                <section className="admin-card">
                  <h2>Weekly hours</h2>
                  <p>Set opening and closing times, then block individual hours below. These repeat weekly in Central Time. Existing appointments stay booked.</p>
                  <div className="hours-list">
                    {hours.map((row) => (
                      <div key={row.weekday}>
                      <div className="hours-row">
                        <strong>{DAY_NAMES[row.weekday]}</strong>
                        <input className="input" aria-label={`${DAY_NAMES[row.weekday]} opening time`} type="time" value={row.start_time.slice(0,5)} onChange={(e) => updateHour(row.weekday, "start_time", e.target.value)} />
                        <input className="input" aria-label={`${DAY_NAMES[row.weekday]} closing time`} type="time" value={row.end_time.slice(0,5)} onChange={(e) => updateHour(row.weekday, "end_time", e.target.value)} />
                        <label><input type="checkbox" checked={row.is_enabled} onChange={(e) => updateHour(row.weekday, "is_enabled", e.target.checked)} /> Open</label>
                      </div>
                      {row.is_enabled && <details><summary>Block individual hours ({row.blocked_hours.length} blocked)</summary><div className="hour-blocks" role="group" aria-label={`${DAY_NAMES[row.weekday]} hourly blocks`}>
                        {Array.from({ length: 24 }, (_, hour) => hour).filter((hour) => {
                          const [startHour, startMinute] = row.start_time.split(":").map(Number);
                          const [endHour, endMinute] = row.end_time.split(":").map(Number);
                          return row.blocked_hours.includes(hour) || (hour * 60 < endHour * 60 + endMinute && (hour + 1) * 60 > startHour * 60 + startMinute);
                        }).map((hour) => {
                          const blocked = row.blocked_hours.includes(hour);
                          const label = `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}–${(hour + 1) % 12 || 12}${hour + 1 < 12 || hour === 23 ? "am" : "pm"}`;
                          return <button key={hour} className={`small-button${blocked ? " danger" : ""}`} aria-pressed={blocked} aria-label={`${DAY_NAMES[row.weekday]} ${label}: ${blocked ? "blocked" : "not blocked"}`} onClick={() => updateHour(row.weekday, "blocked_hours", blocked ? row.blocked_hours.filter((item) => item !== hour) : [...row.blocked_hours, hour].sort((a, b) => a - b))}>{label} · {blocked ? "Blocked" : "Block"}</button>;
                        })}
                      </div></details>}
                      </div>
                    ))}
                  </div>
                  <button className="button button-small" style={{ marginTop: 16 }} onClick={saveHours}>Save hours</button>
                </section>

                <section className="admin-card">
                  <h2>Blocked dates</h2>
                  <form onSubmit={addBlockedDate} className="form-grid">
                    <div className="field full"><label htmlFor="block-date">Date</label><input className="input" id="block-date" name="date" type="date" required /></div>
                    <div className="field full"><label htmlFor="reason">Reason</label><input className="input" id="reason" name="reason" placeholder="Vacation, weather, fully booked…" /></div>
                    <div className="field full"><button className="button button-small">Block date</button></div>
                  </form>
                  <div className="block-list">
                    {blocked.map((item) => <div className="block-item" key={item.id}><span>{item.blocked_date}{item.reason ? ` — ${item.reason}` : ""}</span><button className="small-button danger" onClick={() => removeBlockedDate(item.id)}>Remove</button></div>)}
                  </div>
                </section>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
