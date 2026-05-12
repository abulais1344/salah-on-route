import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | MasjidRoute",
  description: "How MasjidRoute collects, uses, and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-stone-600">Last updated: 6 May 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-stone-700">
        <section>
          <h2 className="text-lg font-semibold text-stone-900">1. Data We Collect</h2>
          <p>
            We may collect approximate or precise location (when you grant permission), device identifier
            submitted with updates, jamaat timing submissions, optional remarks, and uploaded images.
            We also collect operational logs needed for reliability and abuse prevention.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">2. Why We Use Data</h2>
          <p>
            Data is used to show nearby masjids, rank useful results, process timing updates, moderate
            community submissions, and maintain service security and performance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">3. Sharing and Processors</h2>
          <p>
            We rely on trusted service providers for hosting, database, file storage, and maps/geocoding.
            Data is shared only as required to deliver core app functionality.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">4. Retention</h2>
          <p>
            We retain submission and operational data only for as long as needed for app operation,
            moderation, legal compliance, and fraud prevention, then delete or anonymize where possible.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">5. Your Choices</h2>
          <p>
            You can deny location permission at any time, request correction or deletion of submitted data,
            and contact us for privacy questions or complaints.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">6. Security</h2>
          <p>
            We use reasonable technical and organizational safeguards, including transport encryption,
            restricted access, and monitoring. No system can be guaranteed 100% secure.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">7. Children</h2>
          <p>
            This service is not intended for children under the age required by your local law to provide
            valid consent. If you believe a child submitted data, contact us for removal.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">8. Contact</h2>
          <p>
            For privacy requests, email: <a className="font-medium text-orange-700 hover:text-orange-800" href="mailto:privacy@namazroute.app">privacy@namazroute.app</a>
          </p>
        </section>
      </div>
    </main>
  );
}
