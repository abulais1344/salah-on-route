import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Guidelines | Namaz Route",
  description: "Content and conduct rules for community submissions.",
};

export default function CommunityGuidelinesPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Community Guidelines</h1>
      <p className="mt-2 text-sm text-stone-600">Last updated: 6 May 2026</p>

      <div className="mt-6 space-y-6 text-sm leading-7 text-stone-700">
        <p>
          Help keep Namaz Route trustworthy by submitting accurate jamaat timings and respectful remarks.
        </p>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">Allowed</h2>
          <p>Accurate timing updates, relevant masjid notes, and clear, lawful images.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">Not Allowed</h2>
          <p>
            Harassment, hate, spam, political misuse, explicit content, fake updates, or content that violates
            privacy or intellectual property rights.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-stone-900">Moderation</h2>
          <p>
            We may review, edit, or remove submissions and restrict abusive users to protect community quality.
          </p>
        </section>
      </div>
    </main>
  );
}
