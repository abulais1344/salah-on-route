import type { Metadata } from "next";
import { Manrope, Noto_Nastaliq_Urdu, Space_Grotesk } from "next/font/google";
import "./globals.css";

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
    default: "Namaz Route | Nearby Masjid and Namaz Timings",
    template: "%s | Namaz Route",
  },
  description:
    "Find nearby masjids and jamaat timings in India, including cities like Nanded and Hyderabad. Route-aware namaz planning with live map navigation.",
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"),
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/namaz-route-logo.svg", type: "image/svg+xml" },
    ],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Namaz Route | Nearby Masjid and Namaz Timings",
    description:
      "Find nearby masjids and jamaat timings in India with route-aware namaz planning.",
    url: "/",
    siteName: "Namaz Route",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/namaz-route-logo.svg",
        width: 512,
        height: 512,
        alt: "Namaz Route logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Namaz Route | Nearby Masjid and Namaz Timings",
    description:
      "Find nearby masjids and jamaat timings in India with route-aware namaz planning.",
    images: ["/namaz-route-logo.svg"],
  },
  robots: {
    index: true,
    follow: true,
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
