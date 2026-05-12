import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact and Grievance | MasjidRoute",
  description: "Contact details for support, privacy, and grievance requests.",
};

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Contact and Grievance</h1>
      <p className="mt-2 text-sm text-stone-600">For support, legal, privacy, and grievance requests.</p>

      <div className="mt-6 space-y-4 text-sm leading-7 text-stone-700">
        <p>
          General support: <a className="font-medium text-orange-700 hover:text-orange-800" href="mailto:support@namazroute.app">support@namazroute.app</a>
        </p>
        <p>
          Privacy requests: <a className="font-medium text-orange-700 hover:text-orange-800" href="mailto:privacy@namazroute.app">privacy@namazroute.app</a>
        </p>
        <p>
          Grievance officer: <a className="font-medium text-orange-700 hover:text-orange-800" href="mailto:grievance@namazroute.app">grievance@namazroute.app</a>
        </p>
        <p>Response target: within 15 business days.</p>
      </div>
    </main>
  );
}
