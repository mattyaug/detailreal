export function SiteFooter() {
  const name = "Nueces Detail";
  const phone = process.env.NEXT_PUBLIC_BUSINESS_PHONE || "(361) 555-0100";
  const email = process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "matthewdaguinaldo@gmail.com";

  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <div className="brand footer-brand"><img className="brand-logo" src="/nueces-detail-logo.png" alt="Nueces Detail" width={72} height={72} /><span>{name}</span></div>
          <p>Mobile auto detailing serving Portland, Texas and nearby communities.</p>
        </div>
        <div>
          <strong>Contact</strong>
          <a href={`tel:${phone.replace(/\D/g, "")}`}>{phone}</a>
          <a href={`mailto:${email}`}>{email}</a>
        </div>
      </div>
      <div className="shell footer-bottom">© {new Date().getFullYear()} {name}. All rights reserved.</div>
    </footer>
  );
}
