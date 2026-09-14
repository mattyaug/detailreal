import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { confirmationCopy } from "@/lib/booking-confirmation";
import { BookingReceipt } from "./receipt";

export const metadata: Metadata = { title: "Booking confirmation", robots: { index: false, follow: false } };

export default async function ConfirmationPage({ searchParams }: { searchParams: Promise<{ delivery?: string }> }) {
  const { delivery } = await searchParams;
  const copy = confirmationCopy(delivery);
  return <><SiteHeader /><main className="confirmation-page">
    <div className="shell confirmation-layout">
      <div className="confirmation-intro">
        <p className="section-index">Nueces Detail / Your next step</p>
        <h1>{copy.title}</h1>
        <p className="confirmation-lede">{copy.message}</p>
        <p>{copy.next}</p>
        <div className="confirmation-links"><a className="brand-button" href="sms:+13616339667">Text us <span>↗</span></a><a href="tel:+13616339667">Call 361-633-9667</a></div>
        <Link className="confirmation-home" href="/">Back to Nueces Detail ↗</Link>
      </div>
      <aside className="confirmation-note">
        <span className="section-index">Before we arrive</span>
        <h2>We'll bring the detail.<br />You bring the keys.</h2>
        <p>Please have your vehicle accessible and provide access to water and electricity at the appointment location.</p>
        {(delivery === "sent" || delivery === "failed") && <BookingReceipt />}
        <p className="confirmation-contact">Questions or a change of plans?<br /><a href="mailto:contact@nuecesdetail.com">contact@nuecesdetail.com</a></p>
      </aside>
    </div>
  </main><SiteFooter /></>;
}
