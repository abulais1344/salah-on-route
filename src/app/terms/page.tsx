import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Namaz Route",
  description: "Terms that govern the use of Namaz Route.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Terms of Use</h1>
      <p className="mt-2 text-sm text-stone-600">Last updated: 6 May 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-stone-700">
        <section>
          <h2 className="text-lg font-semibold text-stone-900">1. Acceptance</h2>
          <p>
            By using Namaz Route, you agree to these terms. If you do not agree, please do not use the service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">2. Service Nature</h2>
          <p>
            Namaz Route provides masjid discovery and community-updated timing information for convenience.
            Timings may change and must be verified locally when necessary.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">3. User Submissions</h2>
          <p>
            If you submit timings, remarks, or images, you confirm you have the right to share them and that
            the content is accurate to the best of your knowledge.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">4. Prohibited Conduct</h2>
          <p>
            Do not submit abusive, unlawful, misleading, or infringing content. We may remove content and
            restrict access to protect users and data quality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">5. Intellectual Property</h2>
          <p>
            App branding, UI, and platform content belong to Namaz Route or licensors. You retain ownership
            of your submissions while granting us a limited license to display and process them in the app.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">6. Disclaimers and Liability</h2>
          <p>
            The service is provided on an &quot;as is&quot; basis without warranties of uninterrupted availability or
            absolute accuracy. To the extent allowed by law, liability is limited for indirect or incidental loss.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">7. Changes</h2>
          <p>
            We may update these terms. Continued use after updates indicates acceptance of revised terms.
          </p>
        </section>
      </div>
    </main>
  );
}
