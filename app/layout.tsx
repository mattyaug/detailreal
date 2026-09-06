import type { Metadata } from "next";
import "./globals.css";

const businessName = "Nueces Detail";

export const metadata: Metadata = {
  metadataBase: new URL("https://nuecesdetail.com"),
  icons: { icon: [{ url: "/nueces-detail-logo.png", type: "image/png" }], apple: "/nueces-detail-logo.png" },
  title: { default: `${businessName} | Portland, TX`, template: `%s | ${businessName}` },
  description: "Nueces Detail: mobile exterior detailing and full interior resets in Portland, Texas. Book your detail online and we come to you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
