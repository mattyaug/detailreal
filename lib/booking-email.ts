export type BookingEmail = {
  id: string;
  email: string;
  serviceName: string;
  startsAt: string;
  durationMinutes: number;
};

export const OWNER_NOTIFICATION_EMAIL = "matthewdaguinaldo@gmail.com";
type Mail = { from: string; to: string[]; reply_to: string; subject: string; text: string };

export function bookingMessages(booking: BookingEmail, from: string): { customer: Mail; owner: Mail } {
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", dateStyle: "full", timeStyle: "short",
  }).format(new Date(booking.startsAt));
  const details = [
    `Booking reference: ${booking.id}`,
    `Service: ${booking.serviceName}`,
    `Appointment: ${when} (Central Time)`,
    `Estimated duration: ${booking.durationMinutes} minutes`,
  ].join("\n");
  return {
    customer: {
      from, to: [booking.email], reply_to: OWNER_NOTIFICATION_EMAIL,
      subject: "Your detailing appointment is confirmed",
      text: `Hello,\n\nYour appointment is confirmed.\n\n${details}\n\nTo ask a question or request a change, reply to this email.\n\nThank you!\nPortland Mobile Detailing`,
    },
    owner: {
      from, to: [OWNER_NOTIFICATION_EMAIL], reply_to: booking.email,
      subject: "New detailing appointment booked",
      text: `A new appointment has been booked.\n\n${details}\n\nView your owner dashboard to manage this appointment.`,
    },
  };
}

// Await delivery attempts before returning. A provider failure must never roll back
// a committed booking or tell the customer to submit the booking a second time.
export async function sendBookingEmails(
  booking: BookingEmail,
  config = { apiKey: process.env.RESEND_API_KEY, from: process.env.BOOKING_EMAIL_FROM },
  send: typeof fetch = fetch,
): Promise<{ customer: boolean; owner: boolean }> {
  if (!config.apiKey || !config.from) {
    console.error("Booking email is not configured", { bookingId: booking.id });
    return { customer: false, owner: false };
  }
  const messages = bookingMessages(booking, config.from);
  async function deliver(kind: "customer" | "owner") {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await send("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `booking/${booking.id}/${kind}`,
          },
          body: JSON.stringify(messages[kind]),
          signal: AbortSignal.timeout(5000),
        });
        if (response.ok) return true;
        // Do not log provider payloads: they may contain customer information.
        console.error("Booking email rejected", { bookingId: booking.id, kind, status: response.status });
        if (response.status !== 429 && response.status < 500) return false;
      } catch {
        console.error("Booking email request failed", { bookingId: booking.id, kind, attempt });
      }
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return false;
  }
  const [customer, owner] = await Promise.all([deliver("customer"), deliver("owner")]);
  return { customer, owner };
}
