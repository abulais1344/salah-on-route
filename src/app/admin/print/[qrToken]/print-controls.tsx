"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PrintLayout = "a4" | "sticker";

interface PrintControlsProps {
  layout: PrintLayout;
}

export function PrintControls({ layout }: PrintControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setLayout(nextLayout: PrintLayout) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("layout", nextLayout);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-stone-200 bg-white px-4 py-3">
      <p className="text-sm text-stone-700">Choose a layout, then print or save as PDF.</p>

      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-stone-300 bg-stone-50 p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setLayout("a4")}
            className={`rounded-full px-3 py-1.5 transition ${
              layout === "a4" ? "bg-orange-600 text-white" : "text-stone-700 hover:bg-white"
            }`}
          >
            A4 notice board
          </button>
          <button
            type="button"
            onClick={() => setLayout("sticker")}
            className={`rounded-full px-3 py-1.5 transition ${
              layout === "sticker" ? "bg-orange-600 text-white" : "text-stone-700 hover:bg-white"
            }`}
          >
            Counter sticker
          </button>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex min-h-10 items-center rounded-full bg-orange-600 px-4 text-sm font-semibold text-white hover:bg-orange-700"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  );
}
