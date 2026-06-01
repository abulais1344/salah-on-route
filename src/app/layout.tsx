import type { Metadata } from "next";
import { Manrope, Noto_Nastaliq_Urdu, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/analytics";
import { SiteNav } from "@/components/site-nav";
import { SITE_ALT_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-meta";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MasjidRoute - Find Nearby Masjids & Namaz Timings During Travel",
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "namaz timings",
    "nearby masjid",
    "masjid near me",
    "masjid timings",
    "jamaat timings",
    "masjid in nanded",
    "masjid in hyderabad",
    "fajr zuhr asr maghrib isha timings",
    "jummah timings",
    "india masjid finder",
  ],
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/favicon-512.png", type: "image/png", sizes: "512x512" },
      { url: "/favicon.ico", type: "image/x-icon", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/namaz-route-logo.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [
      { url: "/apple-icon.svg", type: "image/svg+xml" },
      { url: "/favicon-192.png", type: "image/png", sizes: "192x192" },
    ],
  },
  openGraph: {
    title: "MasjidRoute - Find Nearby Masjids & Namaz Timings During Travel",
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/favicon-512.png",
        width: 512,
        height: 512,
        alt: "MasjidRoute social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MasjidRoute - Nearby Masjids & Namaz Timings During Travel",
    description: SITE_DESCRIPTION,
    images: ["/favicon-512.png"],
  },
  applicationName: SITE_NAME,
  other: {
    "apple-mobile-web-app-title": SITE_NAME,
    "og:site_name": SITE_NAME,
    "og:locale": "en_IN",
    "application-name": SITE_NAME,
    "site-name": SITE_NAME,
    "alternate-site-name": SITE_ALT_NAME,
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${spaceGrotesk.variable} ${notoNastaliqUrdu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        <div className="overflow-x-hidden flex-1 flex flex-col">{children}</div>
        <Analytics />
      </body>
    </html>
  );
}
