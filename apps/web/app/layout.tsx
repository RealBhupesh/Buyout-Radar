import type { Metadata } from "next";
import localFont from "next/font/local";
import { Shell } from "../components/shell";
import "./globals.css";
import "../styles/analyst.css";
import "../styles/finance.css";
const sentient = localFont({
  src: [
    {
      path: "../public/fonts/sentient-400.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/sentient-500.woff2",
      weight: "500",
      style: "normal",
    },
  ],
  variable: "--font-display",
  display: "swap",
});
export const metadata: Metadata = {
  title: {
    default: "Buyout Radar | Acquisition research",
    template: "%s | Buyout Radar",
  },
  description:
    "A transparent Indian mid-cap buyout research workspace. Explore cash quality, debt capacity and five-year LBO scenarios with traceable assumptions.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sentient.variable}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
