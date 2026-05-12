import type { Metadata } from "next";
import Script from "next/script";
import { HomeShell } from "@/components/home-shell";
import { SITE_ALT_NAME, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site-meta";

export const metadata: Metadata = {
  title: "MasjidRoute - Find Nearby Masjids & Namaz Timings During Travel",
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export default function Home() {
  const baseUrl = SITE_URL;

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    alternateName: SITE_ALT_NAME,
    url: baseUrl,
    description: SITE_DESCRIPTION,
    inLanguage: ["en-IN", "ur", "mr"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: baseUrl,
    logo: `${baseUrl}/namaz-route-logo.svg`,
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I find a nearby masjid during travel?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Use the nearby mode on MasjidRoute to detect your location and view the nearest masjids with jamaat timings.",
        },
      },
      {
        "@type": "Question",
        name: "Can I check jummah timings on route pages?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, route pages show traveller-friendly masjid stops and include jummah/namaz timing references where available.",
        },
      },
      {
        "@type": "Question",
        name: "How do I update incorrect masjid timings?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Open a masjid card and use the update timings flow. Community contributors can submit refreshed timings quickly.",
        },
      },
    ],
  };

  return (
    <>
      <Script
        id="website-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <Script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeShell />
    </>
  );
}
