"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { bookableDates } from "@/lib/booking-dates";
import { type Service, ADD_ONS, VEHICLE_SIZES, priceVehicle, priceAddOns, type AddOnSelection, formatPrice } from "@/lib/services";

type Slot = { value: string; label: string };

type BookingResponse = {
  ok?: boolean;
  emailAccepted?: boolean;
  booking?: { id: string; serviceName: string; startsAt: string; priceCents: number };
  error?: string;
};

export function BookingForm({ initialService, services: SERVICES }: { initialService: string; services: Service[] }) {
  const [serviceSlug, setServiceSlug] = useState(initialService);
  const [vehicleSize, setVehicleSize] = useState<string>("compact");
  const [addOnSelections, setAddOnSelections] = useState<AddOnSelection[]>([]);
  const [utilitiesConfirmed, setUtilitiesConfirmed] = useState(false);
  const addOns = useMemo(() => priceAddOns(addOnSelections), [addOnSelections]);
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
    [serviceSlug, SERVICES],
  );
  const vehiclePricing = priceVehicle(service, vehicleSize);
  const totalPrice = vehiclePricing.priceCents + addOns.priceCents;
  const totalMinutes = service.durationMinutes + addOns.durationMinutes;
  const [dates, setDates] = useState(() => bookableDates());

  useEffect(() => {
    const refresh = () => {
      const nextDates = bookableDates();
      setDates(nextDates);
      setDate((current) => current && current < nextDates[0].value ? "" : current);
    };
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refresh); };
  }, []);

  useEffect(() => {
    setSelectedTime("");
    setSlots([]);
    setError("");
    if (!date || !service) return;

    const controller = new AbortController();
    setLoadingSlots(true);

    fetch(`/api/availability?date=${encodeURIComponent(date)}&service=${encodeURIComponent(service.slug)}&addOns=${encodeURIComponent(JSON.stringify(addOnSelections))}`, {
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
  }, [date, service, addOnSelections]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setConfirmation(undefined);

    if (!utilitiesConfirmed) { setError("Confirm access to water and electricity before booking."); return; }
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
        body: JSON.stringify({ ...payload, serviceSlug, vehicleSize, startsAt: selectedTime, addOns: addOnSelections, utilitiesConfirmed, durationMinutes: totalMinutes }),
      });
      const data: BookingResponse = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to book this appointment.");
      setConfirmation(data.booking);
      setEmailAccepted(data.emailAccepted === true);
      setSelectedTime("");
      setSlots([]);
      setDate("");
      setAddOnSelections([]);
      setVehicleSize("compact");
      setUtilitiesConfirmed(false);
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
        <ul className="service-inclusions">{service.includes.map((item) => <li key={item}>{item}</li>)}</ul>
        <div className="summary-list">
          <div className="summary-item"><span>Base service</span><strong>{formatPrice(service.startingPriceCents)}</strong></div>
          <div className="summary-item"><span>Vehicle size</span><strong>{vehiclePricing.vehicleSize.adjustmentCents ? `+${formatPrice(vehiclePricing.vehicleSize.adjustmentCents)}` : "Base rate"}</strong></div>
          {addOns.priceCents > 0 && <div className="summary-item"><span>Add-ons</span><strong>{formatPrice(addOns.priceCents)}</strong></div>}
          <div className="summary-item" aria-live="polite"><span>Estimated total</span><strong>{formatPrice(totalPrice)}</strong></div>
          <div className="summary-item"><span>Estimated time</span><strong>{totalMinutes / 60} hrs</strong></div>
          <div className="summary-item"><span>Location</span><strong>Portland, TX</strong></div>
        </div>
        <div className="info-box">Your selected vehicle size is included in this estimate. Any additional work for vehicle condition will be discussed before we begin.</div>
      </aside>

      <form className="form-card" onSubmit={submit}>
        <h2>Appointment details</h2>
        <p>All times are shown in Central Time. Same-day appointments are not available; please choose tomorrow or a later date.</p>

        {confirmation && (
          <div className="success-box">
            Booking confirmed. Reference <strong>{confirmation.id.slice(0, 8).toUpperCase()}</strong>. Your {confirmation.serviceName} is scheduled for {new Date(confirmation.startsAt).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "long", timeStyle: "short" })}.
            <p>Estimated total: <strong>{formatPrice(confirmation.priceCents)}</strong>.</p>
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
          <fieldset className="field full vehicle-size-field"><legend>Find your vehicle fit</legend>
            <p className="help" id="vehicle-size-help">Choose the size that best matches your vehicle. Your estimate updates below.</p>
            <div className="vehicle-size-options" aria-describedby="vehicle-size-help">
              {VEHICLE_SIZES.map((size) => <label className={`vehicle-size-option${vehicleSize === size.slug ? " selected" : ""}`} key={size.slug}>
                <input type="radio" name="vehicleSize" value={size.slug} checked={vehicleSize === size.slug} onChange={() => setVehicleSize(size.slug)} required />
                <span><strong>{size.name}</strong><small>{size.description}</small></span>
                <strong className="vehicle-size-price">{size.adjustmentCents ? `+${formatPrice(size.adjustmentCents)}` : "Base rate"}</strong>
              </label>)}
            </div>
            <p className="vehicle-size-total" aria-live="polite">Your estimate <strong>{formatPrice(totalPrice)}</strong></p>
          </fieldset>
          <fieldset className="field full" style={{ border: 0, padding: 0, margin: 0 }}><legend>Add-ons (optional)</legend>
            {ADD_ONS.map((item) => <label className="addon-choice" key={item.slug}><span>{item.name} — {formatPrice(item.priceCents)}{item.slug === "headlight" ? " each" : ""}<small>{item.description} Adds {item.durationMinutes} minutes per selection.</small></span><select className="select" aria-label={`${item.name} quantity`} value={addOnSelections.find((selected) => selected.slug === item.slug)?.quantity ?? 0} onChange={(event) => { const quantity = Number(event.target.value); setSelectedTime(""); setAddOnSelections((current) => [...current.filter((selected) => selected.slug !== item.slug), ...(quantity ? [{ slug: item.slug, quantity }] : [])]); }}><option value={0}>None</option>{Array.from({ length: item.maxQuantity }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>)}
          </fieldset>
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

        <label className="utility-confirmation"><input type="checkbox" required checked={utilitiesConfirmed} onChange={(event) => setUtilitiesConfirmed(event.target.checked)} /><span>I confirm there will be access to water and electricity at the appointment location.</span></label>
        <p className="help">Learn how we handle your booking information in our <Link href="/privacy">Privacy Policy</Link>.</p>
        <div className="form-actions">
          <span className="help" aria-live="polite">Estimated total: <strong>{formatPrice(totalPrice)}</strong>. Submitting reserves the selected time immediately.</span>
          <button className="button" disabled={submitting || !selectedTime || !utilitiesConfirmed}>{submitting ? "Booking…" : "Confirm appointment"}</button>
        </div>
      </form>
    </section>
  );
}
