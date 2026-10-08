"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  problem: string;
  status: string;
  created_at: string;
};

export default function AdminCustomersPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_phone, problem, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading customers:", error);
      setError("Unable to load customers.");
      setLoading(false);
      return;
    }

    setBookings(data || []);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Admin
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Customers
            </h1>

            <p className="mt-2 text-slate-600">
              View customers and their booking activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCustomers}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-600">Loading customers...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="font-medium text-red-700">{error}</p>
          </div>
        )}

        {!loading && !error && bookings.length === 0 && (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-slate-600">No customers found.</p>
          </div>
        )}

        {!loading && !error && bookings.length > 0 && (
          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Customer
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Phone
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Problem
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Status
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold text-slate-700">
                      Booking Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {booking.customer_name}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {booking.customer_phone}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-700">
                        {booking.problem}
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {booking.status.replaceAll("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {new Date(booking.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
