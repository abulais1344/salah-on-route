"use client";

import { trackEvent } from "@/lib/analytics";

interface MasjidQuickActionsProps {
  mosqueName: string;
  navigateUrl: string;
  updateUrl: string;
}

export function MasjidQuickActions({ mosqueName, navigateUrl, updateUrl }: MasjidQuickActionsProps) {
  async function handleShare() {
    const sharePayload = {
      title: `${mosqueName} | MasjidRoute`,
      text: `Check namaz and jummah timings for ${mosqueName} on MasjidRoute.`,
      url: window.location.href,
    };

    trackEvent("share_mosque", { mosque_name: mosqueName });

    if (navigator.share) {
      try {
        await navigator.share(sharePayload);
      } catch {
        // No-op for cancelled share
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Link copied. Share it on WhatsApp.");
    } catch {
      alert("Unable to copy automatically. Please copy from the browser address bar.");
    }
  }

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 sm:static sm:px-0">
      <div className="grid w-full max-w-xl grid-cols-3 gap-2 rounded-[20px] border border-stone-200 bg-white/95 p-2 shadow-[0_16px_30px_rgba(41,37,36,0.16)] backdrop-blur sm:shadow-none">
        <a
          href={navigateUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackEvent("navigate_click", { mosque_name: mosqueName, location: "masjid-page" })}
          className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#4f46e5_0%,#315ae9_42%,#2563eb_100%)] px-3 text-sm font-semibold text-white transition hover:brightness-[0.98]"
        >
          Navigate
        </a>
        <a
          href={updateUrl}
          onClick={() => trackEvent("update_timings_click", { mosque_name: mosqueName, location: "masjid-page" })}
          className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          Update
        </a>
        <button
          type="button"
          onClick={() => void handleShare()}
          className="inline-flex min-h-11 items-center justify-center rounded-[14px] border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
        >
          Share
        </button>
      </div>
    </div>
  );
}
