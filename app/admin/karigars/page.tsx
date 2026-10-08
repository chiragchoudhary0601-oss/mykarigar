"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Karigar = {
  id: string;
  name: string;
  phone: string;
  service: string;
  area: string;
  experience: number;
  rating: number;
  verified: boolean;
  jobs_completed: number;
};

export default function AdminKarigarsPage() {
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [verificationFilter, setVerificationFilter] = useState("all");

  useEffect(() => {
    loadKarigars();
  }, []);

  async function loadKarigars() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("karigars")
      .select(
        "id, name, phone, service, area, experience, rating, verified, jobs_completed"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading Karigars:", error);
      setError(`Unable to load Karigars: ${error.message}`);
      setLoading(false);
      return;
    }

    setKarigars(data ?? []);
    setLoading(false);
  }

  const services = useMemo(() => {
    return Array.from(new Set(karigars.map((karigar) => karigar.service))).sort();
  }, [karigars]);

  const filteredKarigars = useMemo(() => {
    const query = search.trim().toLowerCase();

    return karigars.filter((karigar) => {
      const matchesSearch =
        !query ||
        karigar.name.toLowerCase().includes(query) ||
        karigar.phone.toLowerCase().includes(query) ||
        karigar.service.toLowerCase().includes(query) ||
        karigar.area.toLowerCase().includes(query);

      const matchesService =
        serviceFilter === "all" || karigar.service === serviceFilter;

      const matchesVerification =
        verificationFilter === "all" ||
        (verificationFilter === "verified" && karigar.verified) ||
        (verificationFilter === "pending" && !karigar.verified);

      return matchesSearch && matchesService && matchesVerification;
    });
  }, [karigars, search, serviceFilter, verificationFilter]);

  const verifiedCount = karigars.filter((karigar) => karigar.verified).length;
  const pendingCount = karigars.filter((karigar) => !karigar.verified).length;

  const totalJobs = karigars.reduce(
    (total, karigar) => total + karigar.jobs_completed,
    0
  );

  const averageRating =
    karigars.length > 0
      ? (
          karigars.reduce((total, karigar) => total + Number(karigar.rating), 0) /
          karigars.length
        ).toFixed(1)
      : "0.0";

  function clearFilters() {
    setSearch("");
    setServiceFilter("all");
    setVerificationFilter("all");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white">
                M
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">MyKarigar</p>
                <p className="text-xs font-medium text-slate-500">
                  Admin dashboard
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/admin"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                ← Admin Home
              </Link>

              <Link
                href="/"
                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                View Customer Site
              </Link>

              <button
                type="button"
                onClick={loadKarigars}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page heading */}
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
            <span>Operations</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500">Karigars</span>
          </div>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Karigar Management
              </h1>

              <p className="mt-2 max-w-2xl text-slate-600">
                Monitor your service professionals, their verification status,
                experience, ratings, and completed jobs.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Showing
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {filteredKarigars.length}{" "}
                <span className="font-medium text-slate-500">
                  of {karigars.length}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {!loading && !error && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Total Karigars
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  👷
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {karigars.length}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Service professionals
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Verified
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                  ✓
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {verifiedCount}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Verified professionals
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Pending
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  !
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {pendingCount}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Need verification
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Average Rating
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
                  ★
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {averageRating}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Across all Karigars
              </p>
            </div>
          </div>
        )}

        {/* Search + filters */}
        {!loading && !error && karigars.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row">
              <div className="flex-1">
                <label className="text-sm font-semibold text-slate-700">
                  Search Karigars
                </label>

                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    🔎
                  </span>

                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name, phone, service or area..."
                    className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="w-full lg:w-56">
                <label className="text-sm font-semibold text-slate-700">
                  Service
                </label>

                <select
                  value={serviceFilter}
                  onChange={(e) => setServiceFilter(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All services</option>

                  {services.map((service) => (
                    <option key={service} value={service}>
                      {service}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full lg:w-48">
                <label className="text-sm font-semibold text-slate-700">
                  Verification
                </label>

                <select
                  value={verificationFilter}
                  onChange={(e) => setVerificationFilter(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="all">All statuses</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            {(search ||
              serviceFilter !== "all" ||
              verificationFilter !== "all") && (
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Filters are active.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-5 font-semibold text-slate-900">
              Loading Karigars...
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Fetching your service professionals.
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-red-800">
                  Unable to load Karigars
                </p>

                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>

              <button
                type="button"
                onClick={loadKarigars}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty database */}
        {!loading && !error && karigars.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              👷
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No Karigars found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              There are currently no Karigars available in the database.
            </p>
          </div>
        )}

        {/* No filter results */}
        {!loading &&
          !error &&
          karigars.length > 0 &&
          filteredKarigars.length === 0 && (
            <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                🔎
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                No matching Karigars
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Clear Filters
              </button>
            </div>
          )}

        {/* Karigar cards */}
        {!loading &&
          !error &&
          filteredKarigars.length > 0 && (
            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredKarigars.map((karigar) => (
                <div
                  key={karigar.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* Card top */}
                  <div className="border-b border-slate-100 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-bold text-blue-600">
                          {karigar.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-slate-900">
                            {karigar.name}
                          </h2>

                          <p className="mt-1 text-sm font-semibold text-blue-600">
                            {karigar.service}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
                          karigar.verified
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {karigar.verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Main details */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">
                          Rating
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          ⭐ {Number(karigar.rating).toFixed(1)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">
                          Experience
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {karigar.experience} yrs
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">
                          Jobs done
                        </p>

                        <p className="mt-1 text-lg font-bold text-slate-900">
                          {karigar.jobs_completed}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-medium text-slate-500">
                          Area
                        </p>

                        <p className="mt-1 truncate text-lg font-bold text-slate-900">
                          {karigar.area}
                        </p>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm">
                          📞
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">Phone</p>

                          <p className="text-sm font-semibold text-slate-900">
                            {karigar.phone}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm">
                          📍
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Service area
                          </p>

                          <p className="text-sm font-semibold text-slate-900">
                            {karigar.area}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                      <div>
                        <p className="text-xs text-slate-500">
                          Professional status
                        </p>

                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {karigar.verified
                            ? "Ready for assignments"
                            : "Verification required"}
                        </p>
                      </div>

                      <span
                        className={`h-3 w-3 rounded-full ${
                          karigar.verified
                            ? "bg-green-500"
                            : "bg-amber-500"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}