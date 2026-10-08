"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

type Service = {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
};

const serviceIcons: Record<string, string> = {
  Electrician: "⚡",
  Plumber: "🔧",
  Carpenter: "🪚",
  Painter: "🎨",
  "AC / Appliance Technician": "❄️",
};

export default function CustomerServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, base_price")
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("LOAD SERVICES ERROR:", error);
        setError("Could not load available services.");
        setServices([]);
        setLoading(false);
        return;
      }

      setServices(data ?? []);
      setLoading(false);
    }

    void Promise.resolve().then(loadServices);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/">
            <Logo />
          </Link>

          <Link
            href="/customer/bookings"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            My Bookings
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Hero */}
        <section className="rounded-3xl bg-slate-900 px-6 py-10 text-white shadow-sm sm:px-10">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-blue-100">
              Trusted local professionals
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
              What service do you need?
            </h1>

            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Choose a service, tell us what you need, and we&apos;ll connect
              you with a verified local Karigar.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-300">
              <span>✓ Verified professionals</span>
              <span>✓ Transparent pricing</span>
              <span>✓ Local service</span>
            </div>
          </div>
        </section>

        {/* Section heading */}
        <div className="mt-10 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Available services
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select a service to start your booking.
            </p>
          </div>

          {!loading && !error && services.length > 0 && (
            <p className="text-sm font-medium text-slate-500">
              {services.length} services available
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="h-14 w-14 rounded-2xl bg-slate-200" />
                <div className="mt-5 h-6 w-32 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-full rounded bg-slate-100" />
                <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
                <div className="mt-6 h-11 w-full rounded-lg bg-slate-200" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <p className="font-semibold text-red-700">{error}</p>

            <p className="mt-1 text-sm text-red-600">
              Please refresh the page and try again.
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && services.length === 0 && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl">
              🔧
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              No services available
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Please check back later.
            </p>
          </div>
        )}

        {/* Services */}
        {!loading && !error && services.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.id}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-md"
              >
                {/* Icon */}
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
                  {serviceIcons[service.name] || "🛠️"}
                </div>

                {/* Content */}
                <div className="mt-5 flex-1">
                  <h3 className="text-xl font-bold text-slate-900">
                    {service.name}
                  </h3>

                  <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">
                    {service.description ||
                      "Book a verified local Karigar for reliable professional service."}
                  </p>
                </div>

                {/* Price */}
                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Starting from
                  </p>

                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    ₹{service.base_price ?? 0}
                  </p>
                </div>

                {/* CTA */}
                <Link
                  href={`/customer/book?service=${encodeURIComponent(
                    service.id
                  )}`}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 active:scale-[0.99]"
                >
                  Book {service.name}
                  <span className="ml-2 transition group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}

        {/* Trust section */}
        {!loading && !error && services.length > 0 && (
          <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <div className="text-2xl">✓</div>
                <h3 className="mt-3 font-semibold text-slate-900">
                  Verified Karigars
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Connect with trusted local professionals.
                </p>
              </div>

              <div>
                <div className="text-2xl">₹</div>
                <h3 className="mt-3 font-semibold text-slate-900">
                  Transparent pricing
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  See the starting service price before booking.
                </p>
              </div>

              <div>
                <div className="text-2xl">★</div>
                <h3 className="mt-3 font-semibold text-slate-900">
                  Rate your experience
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Share your experience after the job is completed.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} MyKarigar · Trusted local services
        </div>
      </footer>
    </main>
  );
}