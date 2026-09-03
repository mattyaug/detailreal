import type { Metadata } from "next";
import "./globals.css";

const businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || "Portland Mobile Detailing";

export const metadata: Metadata = {
  title: { default: `${businessName} | Portland, TX`, template: `%s | ${businessName}` },
  description: "Convenient mobile auto detailing in Portland, Texas. Book your detail online and we come to you.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
