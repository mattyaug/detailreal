import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingForm } from "./booking-form";
import { SERVICES } from "@/lib/services";

export const metadata: Metadata = {
  title: "Book a Detail",
  description: "Choose a detailing service and live appointment time in Portland, Texas.",
};

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const params = await searchParams;
  const initialService = SERVICES.some((service) => service.slug === params.service)
    ? params.service
    : SERVICES[0].slug;

  return (
    <>
      <SiteHeader />
      <main className="booking-page">
        <section className="page-hero booking-hero">
          <div className="shell">
            <span className="eyebrow">Book online / Live availability</span>
            <h1>Book your mobile detail.</h1>
            <p>Choose a service, pick a day from the menu, and reserve a live appointment time. We&apos;ll come to you.</p>
          </div>
        </section>
        <BookingForm initialService={initialService!} />
      </main>
      <SiteFooter />
    </>
  );
}
