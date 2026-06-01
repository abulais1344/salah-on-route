import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support | MasjidRoute",
  description: "Contact MasjidRoute for support, suggestions, grievances, or masjid-related help.",
  alternates: { canonical: "/contact" },
};

const WHATSAPP_NUMBER = "918421222893"; // E.164 without +

export default function ContactPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 pb-24 sm:px-6 sm:pt-20 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Contact &amp; Support</h1>
      <p className="mt-2 text-sm text-stone-600">
        Reach out for support, masjid suggestions, grievances, or any feedback.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Email card */}
        <a
          href="mailto:zipdealsindia@gmail.com"
          className="group flex items-start gap-4 rounded-[20px] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-orange-300 hover:shadow-md"
        >
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600 group-hover:bg-orange-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
              <rect x="2" y="4" width="20" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m2 7 10 7 10-7" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Email</p>
            <p className="mt-1 text-sm font-semibold text-stone-900 group-hover:text-orange-700">
              zipdealsindia@gmail.com
            </p>
            <p className="mt-1 text-xs text-stone-500">Support · Privacy · Grievances</p>
          </div>
        </a>

        {/* WhatsApp card */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-4 rounded-[20px] border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
        >
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">WhatsApp Business</p>
            <p className="mt-1 text-sm font-semibold text-stone-900 group-hover:text-emerald-700">
              +91 84212 22893
            </p>
            <p className="mt-1 text-xs text-stone-500">Suggestions · Masjid additions · Quick help</p>
          </div>
        </a>
      </div>

      <div className="mt-8 rounded-[18px] border border-stone-100 bg-stone-50 px-5 py-4 text-sm text-stone-600">
        <p className="font-medium text-stone-700">Response time</p>
        <p className="mt-1">We aim to respond within <span className="font-semibold text-stone-800">2–3 business days</span> for email, and faster on WhatsApp.</p>
        <p className="mt-3 font-medium text-stone-700">Grievance officer</p>
        <p className="mt-1">
          For formal grievances under applicable law, contact us at{" "}
          <a href="mailto:zipdealsindia@gmail.com" className="font-medium text-orange-700 hover:text-orange-800">
            zipdealsindia@gmail.com
          </a>{" "}
          with subject <span className="font-medium text-stone-800">&ldquo;Grievance – MasjidRoute&rdquo;</span>. We will acknowledge within 48 hours and resolve within 15 business days.
        </p>
      </div>
    </main>
  );
}
