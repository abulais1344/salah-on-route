import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatAddressForDisplay } from "@/lib/address";
import { getMosqueByQrToken } from "@/lib/mosques";
import { PrintControls } from "./print-controls";

export const dynamic = "force-dynamic";

export default async function PrintQrPage({
  params,
  searchParams,
}: {
  params: Promise<{ qrToken: string }>;
  searchParams: Promise<{ layout?: string }>;
}) {
  const { qrToken } = await params;
  const { layout: layoutParam } = await searchParams;
  const mosque = await getMosqueByQrToken(qrToken);

  if (!mosque) {
    notFound();
  }

  const layout = layoutParam === "sticker" ? "sticker" : "a4";

  const updatePath = `/update/${mosque.qrToken}`;
  const updateUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000"}${updatePath}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=720x720&data=${encodeURIComponent(
    updateUrl,
  )}`;

  return (
    <main className="min-h-screen bg-stone-100 px-4 py-6 sm:px-6 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-3xl space-y-4 print:max-w-none print:space-y-0">
        <div className="no-print flex items-center justify-between gap-2">
          <Link
            href="/admin"
            className="inline-flex min-h-10 items-center rounded-full border border-stone-300 bg-white px-4 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Back
          </Link>
        </div>

        <PrintControls layout={layout} />

        {layout === "a4" ? (
          <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white shadow-[0_20px_80px_rgba(41,37,36,0.12)] print:rounded-none print:border-0 print:shadow-none">
            <div className="bg-[linear-gradient(130deg,#111827_0%,#1f2937_48%,#312e81_100%)] px-8 py-7 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-100">Namaz Route • Masjid Update QR</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">{mosque.name}</h1>
              <p className="mt-2 text-sm text-slate-200">{formatAddressForDisplay(mosque.address)}</p>
            </div>

            <div className="grid gap-8 p-8 sm:grid-cols-[1fr_1fr]">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-stone-900">For Masjid Committee</h2>
                <ol className="space-y-2 text-sm text-stone-700">
                  <li>1. Scan this QR code.</li>
                  <li>2. Verify mosque details on the summary page.</li>
                  <li>3. Tap &ldquo;Update timings&rdquo; and submit latest jamaat times.</li>
                </ol>
                <div className="rounded-[14px] border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-600">
                  <p className="font-semibold text-stone-800">Update link</p>
                  <p className="mt-1 break-all">{updateUrl}</p>
                </div>
                <div className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  Last updated: {new Date(mosque.lastUpdated).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-[20px] border border-stone-200 bg-stone-50 p-4">
                <Image
                  src={qrUrl}
                  alt={`QR code for ${mosque.name}`}
                  width={300}
                  height={300}
                  className="rounded-[14px] border border-stone-200 bg-white"
                  priority
                />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Scan to update jamaat timings
                </p>
              </div>
            </div>
          </section>
        ) : (
          <section className="mx-auto w-full max-w-md rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_20px_70px_rgba(41,37,36,0.14)] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <div className="rounded-[18px] bg-[linear-gradient(130deg,#111827_0%,#1f2937_48%,#312e81_100%)] px-5 py-4 text-white print:rounded-none">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-100">Namaz Route</p>
              <h1 className="mt-2 text-xl font-semibold leading-tight">{mosque.name}</h1>
              <p className="mt-1 text-xs text-slate-200">{formatAddressForDisplay(mosque.address)}</p>
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-4 p-5 print:p-4">
              <Image
                src={qrUrl}
                alt={`QR code for ${mosque.name}`}
                width={120}
                height={120}
                className="rounded-[10px] border border-stone-200 bg-white"
                priority
              />
              <div className="space-y-2 text-xs text-stone-700">
                <p className="font-semibold text-stone-900">Scan to update jamaat timings</p>
                <p>Committee only: verify masjid details and submit latest times.</p>
                <p className="text-[11px] text-stone-500">Updated: {new Date(mosque.lastUpdated).toLocaleString()}</p>
              </div>
            </div>
          </section>
        )}

      </div>

      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }

          @page {
            size: ${layout === "a4" ? "A4" : "A6"};
            margin: 12mm;
          }
        }
      `}</style>
    </main>
  );
}
