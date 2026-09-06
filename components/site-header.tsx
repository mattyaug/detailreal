import Link from "next/link";

export function SiteHeader() {
  const name = "Nueces Detail";
  const phone = "361-633-9667";

  return (
    <header className="site-header">
      <div className="shell nav-wrap">
        <Link className="brand" href="/" aria-label={`${name} home`}>
          <img className="brand-logo" src="/nueces-detail-logo.png" alt="Nueces Detail" width={72} height={72} />
          <span className="brand-name">{name}</span>
        </Link>
        <nav className="desktop-nav" aria-label="Primary navigation">
          <a href="/#services">Services</a>
          <a href="/#process">Our process</a>
          <a href="/#service-area">Service area</a>
          <Link className="nav-book" href="/book">Book a detail <span>↗</span></Link>
        </nav>
        <a className="mobile-call" href={`tel:${phone.replace(/\D/g, "")}`}>Call</a>
      </div>
    </header>
  );
}
