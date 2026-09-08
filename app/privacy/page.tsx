import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Nueces Detail handles your appointment details, contact information, and website data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="privacy-page">
        <article className="shell privacy-content">
        <p className="eyebrow">Nueces Detail / Your information</p>
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: September 8, 2026</p>
        <p>This policy explains how Nueces Detail, a mobile auto detailing business serving Portland, Texas and nearby communities, handles information collected through nuecesdetail.com and appointment-related communications.</p>

        <section aria-labelledby="privacy-collection">
          <h2 id="privacy-collection">Information we collect</h2>
          <p>When you book, we collect your name, email address, phone number, service address, vehicle details and size, selected services and add-ons, appointment time, and any notes you provide. We also record your confirmation of access to water and electricity, the price estimate, booking reference, and appointment status.</p>
          <p>If you call, text, or email us, we receive the contact details and information you share. Please avoid including payment card numbers or other sensitive information in booking notes or messages. The online booking form does not collect payment card details.</p>
        </section>
        <section aria-labelledby="privacy-use">
          <h2 id="privacy-use">How we use information</h2>
          <p>We use your information to schedule and provide detailing services, send booking confirmations, respond to questions, coordinate access to your vehicle, manage changes or cancellations, and maintain service records. We also use technical information to operate, troubleshoot, and protect the website.</p>
        </section>
        <section aria-labelledby="privacy-providers">
          <h2 id="privacy-providers">Service providers and sharing</h2>
          <p>The website and booking database are hosted on Cloudflare. Booking emails are sent through Resend, which receives the recipient email address and appointment information included in the message. The business owner receives an appointment notification and can access booking details through a restricted owner dashboard.</p>
          <p>Our homepage loads video from Pexels. Loading that media connects your browser to the media provider, which may receive your IP address and browser or request information. Hosting and communication providers may also process technical data to deliver and secure their services, under their own privacy policies.</p>
          <p>We share information as needed to provide the service, comply with applicable legal obligations, or protect customers and our business.</p>
        </section>
        <section aria-labelledby="privacy-cookies">
          <h2 id="privacy-cookies">Cookies and technical data</h2>
          <p>The owner dashboard uses a session cookie to keep the owner signed in. You do not need an account to book a detail. Hosting and security services may process IP addresses, browser details, request times, and diagnostic logs. You can manage cookies in your browser; blocking necessary cookies may affect sign-in or other site functions.</p>
        </section>
        <section aria-labelledby="privacy-contact">
          <h2 id="privacy-contact">Calls, texts, and emails</h2>
          <p>We use the contact information you provide for appointment-related communication. Submitting a booking is not a sign-up for promotional text messages. If you text us, your mobile carrier may charge message or data rates. Tell us if you prefer a particular contact method.</p>
        </section>
        <section aria-labelledby="privacy-retention">
          <h2 id="privacy-retention">Retention and security</h2>
          <p>Booking records are stored to manage appointments and service history. Cancelling an appointment changes its status rather than automatically deleting its record. Contact us to request deletion; some information may need to be retained for recordkeeping, resolving disputes, or legal obligations.</p>
          <p>We restrict access to the owner dashboard and use HTTPS for the website. No internet service or storage system can guarantee absolute security.</p>
        </section>
        <section aria-labelledby="privacy-choices">
          <h2 id="privacy-choices">Your choices and questions</h2>
          <p>You may ask about information we hold about you, request a correction or deletion, or raise a privacy concern by emailing <a href="mailto:contact@nuecesdetail.com">contact@nuecesdetail.com</a> or calling or texting <a href="tel:+13616339667">361-633-9667</a>. We may need to verify your identity before acting on a request.</p>
          <p>We may update this policy as our services change. The date above identifies the most recent update.</p>
        </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
