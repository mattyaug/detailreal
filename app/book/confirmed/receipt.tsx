"use client";

import { useEffect, useState } from "react";
import { CONFIRMATION_STORAGE_KEY } from "@/lib/booking-confirmation";
import { formatPrice } from "@/lib/services";

type Receipt = { id: string; serviceName: string; startsAt: string; priceCents: number; savedAt: number };

export function BookingReceipt() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  useEffect(() => {
    try {
      const value = JSON.parse(sessionStorage.getItem(CONFIRMATION_STORAGE_KEY) || "null");
      if (value && typeof value.id === "string" && typeof value.serviceName === "string" &&
          typeof value.startsAt === "string" && Number.isFinite(Date.parse(value.startsAt)) &&
          Number.isInteger(value.priceCents) && value.priceCents >= 0 &&
          typeof value.savedAt === "number" && Date.now() - value.savedAt < 86400000) setReceipt(value);
    } catch { /* The email guidance remains available when browser storage is disabled. */ }
  }, []);
  if (!receipt) return null;
  return <dl className="confirmation-receipt">
    <div><dt>Booking reference</dt><dd>{receipt.id.slice(0, 8).toUpperCase()}</dd></div>
    <div><dt>Your service</dt><dd>{receipt.serviceName}</dd></div>
    <div><dt>Appointment · Central Time</dt><dd>{new Date(receipt.startsAt).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "long", timeStyle: "short" })}</dd></div>
    <div><dt>Estimated total</dt><dd>{formatPrice(receipt.priceCents)}</dd></div>
  </dl>;
}
