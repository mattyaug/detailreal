import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SERVICES, ADD_ONS, formatPrice } from "@/lib/services";

const packageNumbers = ["01", "02", "03", "04"];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="home">
        <section className="film-hero">
          <video
            className="hero-film"
            autoPlay
            muted
            loop
            playsInline
            poster="/detail-studio.svg"
            aria-label="A freshly detailed car being finished by hand"
          >
            <source src="https://videos.pexels.com/video-files/4488706/4488706-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
          <div className="film-shade" />
          <div className="film-copy shell">
            <p className="kicker">Nueces Detail · Portland, Texas</p>
            <h1>A better clean.<br /><em>At your curb.</em></h1>
            <div className="hero-bottom">
              <p>Industrial-grade Koch-Chemie exterior care. A complete interior reset. At your curb.</p>
              <Link className="brand-button" href="/book">Schedule a detail <span>↗</span></Link>
            </div>
          </div>
          <a className="scroll-note" href="#services"><span>Scroll</span><i /></a>
        </section>

        <section className="intro-strip">
          <div className="shell intro-grid">
            <p className="section-index">01 / What we do</p>
            <h2>Good detailing is less about shine—more about <em>care.</em></h2>
            <p className="intro-copy">We bring the setup to you and take our time with the details: seams, glass, trim, wheels, and all the places quick washes miss.</p>
          </div>
        </section>

        <section className="packages" id="services">
          <div className="shell">
            <div className="package-heading">
              <p className="section-index">02 / Services</p>
              <h2>Pick your reset.</h2>
              <p>Clear packages. Honest starting prices. No mystery menu.</p>
            </div>
            <div className="package-list">
              {SERVICES.map((service, index) => (
                <Link className="package-row" href={`/book?service=${service.slug}`} key={service.slug}>
                  <span className="package-no">{packageNumbers[index]}</span>
                  <div><h3>{service.name}</h3><p>{service.description}</p><ul className="service-inclusions">{service.includes.map((item) => <li key={item}>{item}</li>)}</ul></div>
                  <div className="package-price"><small>from</small><strong>{formatPrice(service.startingPriceCents)}</strong></div>
                  <span className="package-time">{service.durationMinutes / 60} hr{service.durationMinutes > 60 ? "s" : ""}</span>
                  <span className="circle-arrow">↗</span>
                </Link>
              ))}
            </div>
            <div className="addon-catalog"><h3>Add to your detail</h3><ul>{ADD_ONS.map((item) => <li key={item.slug}><strong>{item.name} — {formatPrice(item.priceCents)}{item.slug === "headlight" ? " each" : ""}</strong><p>{item.description}</p></li>)}</ul></div>
          </div>
        </section>

        <section className="manifesto" id="process">
          <div className="shell manifesto-grid">
            <div className="manifesto-image" role="img" aria-label="Clean black car bodywork and wheel" />
            <div className="manifesto-copy">
              <p className="section-index">03 / The difference</p>
              <h2>We come prepared. You get your day back.</h2>
              <div className="principles">
                <div><span>01</span><h3>Book online</h3><p>Choose a package and a live appointment time. That’s it.</p></div>
                <div><span>02</span><h3>We show up</h3><p>At your home or workplace with the tools for the job. Please provide access to water and electricity.</p></div>
                <div><span>03</span><h3>Drive happy</h3><p>Walk around it with us, then enjoy the clean-car feeling.</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="local-section" id="service-area">
          <div className="shell local-grid">
            <p className="section-index">04 / Local service</p>
            <div><h2>Made for the<br />Coastal Bend.</h2><p>Based in Portland and serving the surrounding community. Not sure if you’re in range? Give us a call.</p></div>
            <div className="location-stamp"><span>27.8778° N</span><b>PORTLAND</b><span>97.3239° W</span></div>
          </div>
        </section>

        <section className="book-banner">
          <div className="shell">
            <p>Ready for a reset?</p>
            <Link href="/book">Book your detail <span>↗</span></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
