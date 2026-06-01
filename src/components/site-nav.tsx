"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const WA_LINK = "https://wa.me/918421222893";

export function SiteNav() {
  const pathname = usePathname();

  // Home page has its own interactive nav embedded in HomeShell
  if (pathname === "/") return null;

  const isHome = pathname === "/";
  const isFlight = pathname.startsWith("/flight");
  const isContact = pathname === "/contact";

  return (
    <>
      {/* ── Mobile bottom nav ── */}
      <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
        <div className="border-t border-stone-200/80 bg-white/95 backdrop-blur-md">
          <nav className="grid grid-cols-4" aria-label="Main navigation">
            {/* Nearby */}
            <Link
              href="/?mode=nearby"
              className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition-colors ${
                isHome ? "text-blue-600" : "text-stone-400"
              }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 4.97 5.333 10.621 5.553 10.854a.643.643 0 0 0 .894 0C12.667 18.621 18 12.97 18 8c0-3.314-2.686-6-6-6z" />
                <circle cx="12" cy="8" r="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Nearby</span>
            </Link>

            {/* Route */}
            <Link
              href="/?mode=route"
              className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition-colors ${
                isHome ? "text-blue-600" : "text-stone-400"
              }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 17c0-1.7 1.3-3 3-3h10c1.7 0 3-1.3 3-3S18.7 8 17 8H7C5.3 8 4 6.7 4 5" />
                <circle cx="4" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="20" cy="17" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <span>Route</span>
            </Link>

            {/* Flight */}
            <Link
              href="/flight"
              className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition-colors ${
                isFlight ? "text-blue-600" : "text-stone-400"
              }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={isFlight ? 2 : 1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2v0A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span>Flight</span>
            </Link>

            {/* Suggest */}
            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition-colors ${
                isContact ? "text-blue-600" : "text-stone-400"
              }`}
            >
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 0 1 6 6c0 2.33-1.26 4.36-3.13 5.4L14 17H10l-.87-2.6A6.001 6.001 0 0 1 6 9a6 6 0 0 1 6-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h4" />
              </svg>
              <span>Suggest</span>
            </a>
          </nav>
          <div style={{ height: "env(safe-area-inset-bottom)" }} />
        </div>
      </div>

      {/* ── Desktop top nav strip ── */}
      <div className="hidden sm:block fixed top-0 inset-x-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center gap-1 px-6 py-2 lg:px-8">
          <Link
            href="/"
            className="mr-4 flex items-center gap-2 text-sm font-bold tracking-tight text-stone-900"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/namaz-route-logo.svg" alt="" className="h-7 w-7 rounded-xl border border-stone-200" />
            MasjidRoute
          </Link>

          <div className="flex items-center gap-0.5">
            <Link
              href="/?mode=nearby"
              className="flex items-center gap-1.5 rounded-[11px] px-3 py-2 text-xs font-semibold text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.686 2 6 4.686 6 8c0 4.97 5.333 10.621 5.553 10.854a.643.643 0 0 0 .894 0C12.667 18.621 18 12.97 18 8c0-3.314-2.686-6-6-6z" />
                <circle cx="12" cy="8" r="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Nearby
            </Link>

            <Link
              href="/?mode=route"
              className="flex items-center gap-1.5 rounded-[11px] px-3 py-2 text-xs font-semibold text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 17c0-1.7 1.3-3 3-3h10c1.7 0 3-1.3 3-3S18.7 8 17 8H7C5.3 8 4 6.7 4 5" />
                <circle cx="4" cy="5" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="20" cy="17" r="1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              Route
            </Link>

            <Link
              href="/flight"
              className={`flex items-center gap-1.5 rounded-[11px] px-3 py-2 text-xs font-semibold transition-all ${
                isFlight
                  ? "bg-blue-50 text-blue-700"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-800"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2v0A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              Flight
            </Link>

            <a
              href={WA_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-[11px] px-3 py-2 text-xs font-semibold text-stone-500 transition-all hover:bg-stone-100 hover:text-stone-800"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a6 6 0 0 1 6 6c0 2.33-1.26 4.36-3.13 5.4L14 17H10l-.87-2.6A6.001 6.001 0 0 1 6 9a6 6 0 0 1 6-6z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 21h4" />
              </svg>
              Suggest
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
