import Link from "next/link";

export function SiteFooter() {
  const name = "Nueces Detail";
  const phone = "361-633-9667";
  const email = "contact@nuecesdetail.com";

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="brand footer-brand"><img className="brand-logo" src="/nueces-detail-logo.png" alt="Nueces Detail" width={72} height={72} /><span>{name}</span></div>
          <p>Mobile auto detailing serving Portland, Texas and nearby communities.</p>
        </div>
        <div>
          <strong>Contact</strong>
          <p className="footer-phone"><strong>Call or text <a href={`tel:+1${phone.replace(/\D/g, "")}`}>{phone}</a></strong></p>
          <a href={`sms:+1${phone.replace(/\D/g, "")}`}>Send us a text ↗</a>
          <a href={`mailto:${email}`}>{email}</a>
        </div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} {name}. All rights reserved.</span><Link href="/privacy">Privacy Policy</Link></div>
    </footer>
  );
}
