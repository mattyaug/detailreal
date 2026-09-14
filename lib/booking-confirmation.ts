export const CONFIRMATION_STORAGE_KEY = "nueces-booking-confirmation";

export function confirmationPath(emailAccepted: boolean) {
  return `/book/confirmed?delivery=${emailAccepted ? "sent" : "failed"}`;
}

export function confirmationCopy(delivery: string | undefined) {
  if (delivery === "sent") return {
    title: "You're booked. Check your inbox.",
    message: "Your appointment is saved and your confirmation email has been submitted for delivery. Look for a message from Nueces Detail with your appointment information.",
    next: "Give it a few minutes, then check your spam or junk folder if you don't see it. Still missing? Call or text us and we'll help.",
  };
  if (delivery === "failed") return {
    title: "You're booked. Let's confirm the details.",
    message: "Your appointment is saved, but we couldn't send the confirmation email. Please call or text us so we can confirm the details with you.",
    next: "You do not need to book again. Keep your booking reference below if one is shown.",
  };
  return {
    title: "Looking for your confirmation?",
    message: "If you've already booked, check your inbox for a confirmation from Nueces Detail. Check spam or junk too.",
    next: "If you can't find it, call or text us before making another appointment.",
  };
}
