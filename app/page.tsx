import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SERVICES, formatPrice } from "@/lib/services";

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="hero">
          <div className="shell hero-grid">
            <div className="hero-copy">
              <span className="eyebrow">Mobile detailing • Portland, Texas</span>
              <h1>Professional car care, right in your driveway.</h1>
              <p className="hero-lede">Skip the shop. Pick your service, choose an available time, and get your vehicle detailed at home or work.</p>
              <div className="hero-actions">
                <Link className="button" href="/book">Check availability</Link>
                <a className="button button-ghost" href="#services">View services</a>
              </div>
              <div className="trust-row"><span>✓ Online booking</span><span>✓ Mobile service</span><span>✓ Local to Portland</span></div>
            </div>
            <div className="hero-placeholder" aria-label="Future detailing image area">
              <div className="placeholder-badge">Your photos go here next</div>
              <div className="car-silhouette">✦</div>
              <p>Built to swap in before/after photos without changing the layout.</p>
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="shell">
            <div className="section-heading">
              <span className="eyebrow">Services</span>
              <h2>Choose the level of clean your vehicle needs.</h2>
              <p>Starter pricing is centralized in one file so you can change it before launch.</p>
            </div>
            <div className="card-grid">
              {SERVICES.map((service) => (
                <article className="service-card" key={service.slug}>
                  <div className="service-icon">✦</div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="service-meta"><strong>From {formatPrice(service.startingPriceCents)}</strong><span>~{service.durationMinutes / 60} hr{service.durationMinutes > 60 ? "s" : ""}</span></div>
                  <Link href={`/book?service=${service.slug}`}>Book this service →</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-alt" id="process">
          <div className="shell">
            <div className="section-heading"><span className="eyebrow">Simple scheduling</span><h2>Three steps. No back-and-forth texts.</h2></div>
            <div className="steps">
              <div><span>01</span><h3>Pick a service</h3><p>Choose the detail package that fits your vehicle.</p></div>
              <div><span>02</span><h3>Choose a live time</h3><p>The scheduler only shows slots that are actually available.</p></div>
              <div><span>03</span><h3>We come to you</h3><p>Add your address and vehicle information so the appointment is ready to go.</p></div>
            </div>
          </div>
        </section>

        <section className="section" id="service-area">
          <div className="shell split-panel">
            <div><span className="eyebrow">Service area</span><h2>Based in Portland, TX.</h2><p>Launch copy currently focuses on Portland. Nearby cities can be added once you confirm your travel radius and any trip fees.</p></div>
            <div className="area-box"><strong>Primary area</strong><span>Portland, Texas</span><small>San Patricio County / Coastal Bend</small></div>
          </div>
        </section>

        <section className="cta-section">
          <div className="shell cta-box"><div><span className="eyebrow">Ready when you are</span><h2>See the next available appointment.</h2></div><Link className="button button-light" href="/book">Book your detail</Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
