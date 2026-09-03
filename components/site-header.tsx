import Link from "next/link";

export function SiteHeader() {
  const name = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Portland Mobile Detailing";
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE || "(361) 555-0100";

  return (
    <header className="site-header">
      <div className="shell nav-wrap">
        <Link className="brand" href="/" aria-label={`${name} home`}>
          <span className="brand-mark">PMD</span>
          <span>{name}</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="/#services">Services</a>
          <a href="/#process">How it works</a>
          <a href="/#service-area">Service area</a>
          <Link className="button button-small" href="/book">Book now</Link>
        </nav>
        <a className="mobile-call" href={`tel:${phone.replace(/\D/g, "")}`}>Call</a>
      </div>
    </header>
  );
}
