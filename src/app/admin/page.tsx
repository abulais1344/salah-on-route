"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { formatAddressForDisplay } from "@/lib/address";
import type { MosqueView } from "@/types/mosque";

interface AdminResponse {
  mosques?: MosqueView[];
  error?: string;
}

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingMosqueId, setDeletingMosqueId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [mosques, setMosques] = useState<MosqueView[]>([]);
  const [search, setSearch] = useState("");
  const [statsCalculatedAt, setStatsCalculatedAt] = useState(() => Date.now());

  const freshnessStats = useMemo(() => {
    const freshnessWindowMs = 1000 * 60 * 60 * 24 * 5;
    const updatedIn5Days = mosques.filter(
      (entry) => statsCalculatedAt - new Date(entry.lastUpdated).getTime() <= freshnessWindowMs,
    ).length;

    return {
      updatedIn5Days,
      needRefresh: Math.max(0, mosques.length - updatedIn5Days),
    };
  }, [mosques, statsCalculatedAt]);

  const filteredMosques = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return mosques;
    }

    return mosques.filter((mosque) => {
      return (
        mosque.name.toLowerCase().includes(query) ||
        mosque.address.toLowerCase().includes(query) ||
        mosque.qrToken.toLowerCase().includes(query)
      );
    });
  }, [mosques, search]);

  async function loadMosques() {
    if (!token.trim()) {
      setError("Enter admin token to load dashboard.");
      setNotice(null);
      return;
    }

    setError(null);
    setNotice(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/mosques", {
        headers: {
          "x-admin-token": token.trim(),
        },
      });

      const payload = (await response.json()) as AdminResponse;
      if (!response.ok || !payload.mosques) {
        throw new Error(payload.error || "Unable to load admin data.");
      }

      setMosques(payload.mosques);
      setStatsCalculatedAt(Date.now());
      setHasLoaded(true);
      setNotice(
        payload.mosques.length > 0
          ? `Loaded ${payload.mosques.length} masjid${payload.mosques.length === 1 ? "" : "s"}.`
          : "Token is valid, but no masjids found yet. Add data in Supabase table 'mosques'.",
      );
    } catch (loadError) {
      setMosques([]);
      setHasLoaded(true);
      setNotice(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load admin data.");
    } finally {
      setIsLoading(false);
    }
  }

  async function deleteMosque(mosque: MosqueView) {
    const isConfirmed = window.confirm(
      `Delete ${mosque.name}? This will remove masjid timings and linked records from dashboard data.`,
    );

    if (!isConfirmed) {
      return;
    }

    setDeletingMosqueId(mosque.id);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch(`/api/admin/mosques/${mosque.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": token.trim(),
        },
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to delete masjid.");
      }

      setMosques((current) => current.filter((entry) => entry.id !== mosque.id));
      setStatsCalculatedAt((current) => current + 1);
      setNotice(`${mosque.name} deleted successfully.`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete masjid.");
    } finally {
      setDeletingMosqueId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fafaf9_35%,#f5f5f4_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-[0_14px_50px_rgba(41,37,36,0.08)] sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-700">Admin dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Masjid QR and freshness manager
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Generate/print unique QR update links for masjid committees and monitor last update freshness.
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              type="password"
              placeholder="Enter ADMIN_DASHBOARD_TOKEN"
              className="min-h-11 rounded-[14px] border border-stone-300 bg-stone-50 px-3 text-sm text-stone-900 placeholder:text-stone-500 focus:border-orange-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void loadMosques()}
              className="min-h-11 rounded-full bg-orange-600 px-5 text-sm font-semibold text-white transition hover:bg-orange-700"
            >
              {isLoading ? "Loading..." : "Load dashboard"}
            </button>
          </div>

          {error ? <p className="mt-3 text-sm font-medium text-rose-700">{error}</p> : null}
          {notice ? <p className="mt-3 text-sm font-medium text-emerald-700">{notice}</p> : null}
          {mosques.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Total masjids" value={String(mosques.length)} />
              <Stat label="Verified" value={String(mosques.filter((entry) => entry.isVerified).length)} />
              <Stat label="Updated in 5 days" value={String(freshnessStats.updatedIn5Days)} />
              <Stat label="Need refresh" value={String(freshnessStats.needRefresh)} />
            </div>
          ) : null}
        </section>

        {hasLoaded && mosques.length === 0 && !error ? (
          <section className="rounded-[24px] border border-dashed border-stone-300 bg-white p-5 text-sm text-stone-700 shadow-[0_12px_40px_rgba(41,37,36,0.06)]">
            <p className="font-semibold text-stone-900">No masjids available in admin list.</p>
            <p className="mt-2">Add rows to the Supabase table <strong>mosques</strong>, then click <strong>Load dashboard</strong> again.</p>
          </section>
        ) : null}

        {mosques.length > 0 ? (
          <section className="rounded-[28px] border border-stone-200 bg-white p-4 shadow-[0_14px_50px_rgba(41,37,36,0.08)] sm:p-5">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by masjid, address, or QR token"
              className="min-h-11 w-full rounded-[14px] border border-stone-300 bg-stone-50 px-3 text-sm text-stone-900 placeholder:text-stone-500 focus:border-orange-400 focus:outline-none"
            />

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {filteredMosques.map((mosque) => {
                const updateUrl = `${window.location.origin}/update/${mosque.qrToken}`;
                const editUrl = `${updateUrl}?edit=1`;
                const printUrl = `/admin/print/${mosque.qrToken}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                  updateUrl,
                )}`;

                return (
                  <article
                    key={mosque.id}
                    className="rounded-[20px] border border-stone-200 bg-stone-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold text-stone-900">{mosque.name}</h2>
                        <p className="mt-1 text-xs text-stone-600">{formatAddressForDisplay(mosque.address)}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-stone-600">
                          <span
                            className={`rounded-full px-2.5 py-1 font-semibold ${
                              mosque.isVerified
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-stone-200 text-stone-700"
                            }`}
                          >
                            {mosque.isVerified ? "Verified" : "Unverified"}
                          </span>
                          <span>Updated {mosque.updatedAgo}</span>
                          <span>{new Date(mosque.lastUpdated).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid gap-3 sm:grid-cols-[180px_1fr]">
                      <Image
                        src={qrUrl}
                        alt={`QR for ${mosque.name}`}
                        width={180}
                        height={180}
                        className="rounded-[12px] border border-stone-200 bg-white"
                      />

                      <div className="space-y-2 text-xs text-stone-700">
                        <p className="font-semibold text-stone-900">QR update link</p>
                        <p className="break-all rounded-[10px] bg-white px-3 py-2">{updateUrl}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => void navigator.clipboard.writeText(updateUrl)}
                            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 font-semibold text-stone-700 transition hover:bg-stone-100"
                          >
                            Copy QR link
                          </button>
                          <a
                            href={updateUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 font-semibold text-stone-700 transition hover:bg-stone-100"
                          >
                            Open summary
                          </a>
                          <a
                            href={editUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full bg-orange-600 px-3 py-1.5 font-semibold text-white transition hover:bg-orange-700"
                          >
                            Open edit form
                          </a>
                          <a
                            href={printUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-full border border-orange-300 bg-orange-50 px-3 py-1.5 font-semibold text-orange-700 transition hover:bg-orange-100"
                          >
                            Print PDF
                          </a>
                          <button
                            type="button"
                            onClick={() => void deleteMosque(mosque)}
                            disabled={deletingMosqueId === mosque.id}
                            className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {deletingMosqueId === mosque.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-stone-200 bg-stone-50 px-3 py-2.5">
      <p className="text-xs uppercase tracking-[0.12em] text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-900">{value}</p>
    </div>
  );
}
