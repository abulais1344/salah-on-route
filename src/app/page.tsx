import Script from "next/script";
import { HomeShell } from "@/components/home-shell";

export default function Home() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Namaz Route",
    url: baseUrl,
    description:
      "Find nearby masjids and jamaat timings in India, including Nanded and Hyderabad.",
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
    name: "Namaz Route",
    url: baseUrl,
    logo: `${baseUrl}/namaz-route-logo.svg`,
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
      <HomeShell />
    </>
  );
}
