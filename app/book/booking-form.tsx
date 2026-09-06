"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SERVICES, formatPrice } from "@/lib/services";

type Slot = { value: string; label: string };

type BookingResponse = {
  ok?: boolean;
  emailAccepted?: boolean;
  booking?: { id: string; serviceName: string; startsAt: string };
  error?: string;
};

function todayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function bookableDates() {
  const [year, month, day] = todayString().split("-").map(Number);
  const start = new Date(year, month - 1, day, 12);

  return Array.from({ length: 90 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const value = [current.getFullYear(), String(current.getMonth() + 1).padStart(2, "0"), String(current.getDate()).padStart(2, "0")].join("-");
    const formatted = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(current);
    return { value, label: index === 0 ? `Today — ${formatted}` : formatted };
  });
}

export function BookingForm({ initialService }: { initialService: string }) {
  const [serviceSlug, setServiceSlug] = useState(initialService);
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedTime, setSelectedTime] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [emailAccepted, setEmailAccepted] = useState(false);
  const [confirmation, setConfirmation] = useState<BookingResponse["booking"]>();

  const service = useMemo(
    () => SERVICES.find((item) => item.slug === serviceSlug) ?? SERVICES[0],
    [serviceSlug],
  );
  const dates = useMemo(bookableDates, []);

  useEffect(() => {
    setSelectedTime("");
    setSlots([]);
    setError("");
    if (!date || !service) return;

    const controller = new AbortController();
    setLoadingSlots(true);

    fetch(`/api/availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service.slug)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load availability.");
        setSlots(data.slots || []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoadingSlots(false));

    return () => controller.abort();
  }, [date, service]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setConfirmation(undefined);

    if (!selectedTime) {
      setError("Choose an available appointment time first.");
      return;
    }

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const payload = Object.fromEntries(formData.entries());

    setSubmitting(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, serviceSlug, startsAt: selectedTime }),
      });
      const data: BookingResponse = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to book this appointment.");
      setConfirmation(data.booking);
      setEmailAccepted(data.emailAccepted === true);
      setSelectedTime("");
      setSlots([]);
      setDate("");
      formElement.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to book this appointment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="shell booking-layout booking-editorial">
      <aside className="booking-summary">
        <span className="eyebrow">01 / Your detail</span>
        <h2>{service.name}</h2>
        <p>{service.description}</p>
        <div className="summary-list">
          <div className="summary-item"><span>Starting price</span><strong>{formatPrice(service.startingPriceCents)}</strong></div>
          <div className="summary-item"><span>Estimated time</span><strong>{Math.round(service.durationMinutes / 30) / 2} hrs</strong></div>
          <div className="summary-item"><span>Location</span><strong>Portland, TX</strong></div>
        </div>
        <div className="info-box">Final price may vary based on vehicle size and condition. We&apos;ll confirm everything before work begins.</div>
      </aside>

      <form className="form-card" onSubmit={submit}>
        <h2>Appointment details</h2>
        <p>All times are shown in Central Time.</p>

        {confirmation && (
          <div className="success-box">
            Booking confirmed. Reference <strong>{confirmation.id.slice(0, 8).toUpperCase()}</strong>. Your {confirmation.serviceName} is scheduled for {new Date(confirmation.startsAt).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "long", timeStyle: "short" })}.
            <p>{emailAccepted ? "Your confirmation email has been submitted for delivery. Please check your inbox and spam folder." : "Your appointment is saved, but we could not send the confirmation email. Keep this reference; you do not need to book again."}</p>
          </div>
        )}
        {error && <div className="error-box">{error}</div>}

        <div className="form-grid">
          <div className="field full">
            <label htmlFor="service">Service</label>
            <select id="service" className="select" value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)}>
              {SERVICES.map((item) => <option key={item.slug} value={item.slug}>{item.name} — from {formatPrice(item.startingPriceCents)}</option>)}
            </select>
          </div>
          <div className="field full">
            <label htmlFor="date">Choose a date</label>
            <select id="date" name="date" className="select date-menu" value={date} onChange={(e) => setDate(e.target.value)} required>
              <option value="">Select a day</option>
              {dates.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </div>
          <div className="field full">
            <label>Available times</label>
            {loadingSlots ? <div className="info-box">Checking the schedule…</div> : !date ? <div className="info-box">Choose a date to see live availability.</div> : slots.length === 0 ? <div className="info-box">No open times on this date. Try another day.</div> : (
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button type="button" className={`slot ${selectedTime === slot.value ? "active" : ""}`} key={slot.value} onClick={() => setSelectedTime(slot.value)}>{slot.label}</button>
                ))}
              </div>
            )}
          </div>

          <div className="field"><label htmlFor="customerName">Name</label><input className="input" id="customerName" name="customerName" autoComplete="name" required /></div>
          <div className="field"><label htmlFor="phone">Phone</label><input className="input" id="phone" name="phone" type="tel" autoComplete="tel" required /></div>
          <div className="field full"><label htmlFor="email">Email</label><input className="input" id="email" name="email" type="email" autoComplete="email" required /></div>
          <div className="field full"><label htmlFor="address">Service address</label><input className="input" id="address" name="address" autoComplete="street-address" placeholder="Street address in Portland, TX" required /></div>
          <div className="field full"><label htmlFor="vehicle">Vehicle</label><input className="input" id="vehicle" name="vehicle" placeholder="Example: 2022 Ford F-150" required /></div>
          <div className="field full"><label htmlFor="notes">Notes</label><textarea className="textarea" id="notes" name="notes" placeholder="Pet hair, stains, access instructions, water/power notes, etc." /></div>
          <div className="honeypot" aria-hidden="true"><label htmlFor="company">Company</label><input id="company" name="company" tabIndex={-1} autoComplete="off" /></div>
        </div>

        <div className="form-actions">
          <span className="help">Submitting reserves the selected time immediately.</span>
          <button className="button" disabled={submitting || !selectedTime}>{submitting ? "Booking…" : "Confirm appointment"}</button>
        </div>
      </form>
    </section>
  );
}
