import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookingForm } from "./booking-form";
import { getConfiguredServices, getConfiguredAddOns } from "@/lib/service-durations";
export const dynamic = "force-dynamic";

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
  const SERVICES = (await getConfiguredServices()).filter(item => item.enabled !== false);
  const addOns = (await getConfiguredAddOns()).filter(item => item.enabled !== false);
  const initialService = SERVICES.some((service) => service.slug === params.service)
    ? params.service
    : SERVICES[0]?.slug;

  return (
    <>
      <SiteHeader />
      <main className="booking-page">
        <section className="page-hero booking-hero">
          <div className="shell">
            <span className="eyebrow">Book online / Live availability</span>
            <h1>Book your Nueces detail.</h1>
            <p>Choose a service, pick a day from the menu, and reserve a live appointment time. We&apos;ll come to you. Water and electricity access is required.</p>
          </div>
        </section>
        {SERVICES.length ? <BookingForm initialService={initialService!} services={SERVICES} addOnCatalog={addOns} /> : <p className="shell">Online booking is temporarily unavailable. Please call or text us.</p>}
      </main>
      <SiteFooter />
    </>
  );
}

