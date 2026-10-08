"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  problem: string;
  address: string;
  preferred_time: string;
  status: string;
  karigar_id: string | null;
};

type Quote = {
  id: string;
  labour_cost: number;
  parts_cost: number;
  total: number;
  description: string;
  warranty: string | null;
  status: string;
};

type Karigar = {
  id: string;
  name: string;
  phone: string;
  service: string;
  area: string;
  experience: number;
  rating: number;
  jobs_completed: number;
};

export default function AdminBookingDetailsPage() {
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [karigar, setKarigar] = useState<Karigar | null>(null);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooking() {
      setLoading(true);
      setError("");

      const { data: bookingData, error: bookingError } =
        await supabase
          .from("bookings")
          .select(
            "id, customer_name, customer_phone, problem, address, preferred_time, status, karigar_id"
          )
          .eq("id", bookingId)
          .single();

      if (bookingError || !bookingData) {
        console.error(bookingError);
        setError("Unable to load this booking.");
        setLoading(false);
        return;
      }

      setBooking(bookingData);

      if (bookingData.karigar_id) {
        const { data: karigarData } = await supabase
          .from("karigars")
          .select(
            "id, name, phone, service, area, experience, rating, jobs_completed"
          )
          .eq("id", bookingData.karigar_id)
          .single();

        setKarigar(karigarData || null);
      }

      const { data: quoteData } = await supabase
        .from("quotes")
        .select(
          "id, labour_cost, parts_cost, total, description, warranty, status"
        )
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setQuote(quoteData || null);

      setLoading(false);
    }

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId]);

  async function updateQuoteStatus(newStatus: "approved" | "rejected") {
    if (!quote || !booking) {
      return;
    }

    setActionLoading(true);
    setMessage("");

    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        status: newStatus,
      })
      .eq("id", quote.id);

    if (quoteError) {
      console.error(quoteError);
      setMessage("Unable to update quotation.");
      setActionLoading(false);
      return;
    }

    const bookingStatus =
      newStatus === "approved"
        ? "quotation_approved"
        : "in_progress";

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: bookingStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (bookingError) {
      console.error(bookingError);
      setMessage("Quotation updated, but booking status failed.");
      setActionLoading(false);
      return;
    }

    setQuote({
      ...quote,
      status: newStatus,
    });

    setBooking({
      ...booking,
      status: bookingStatus,
    });

    setMessage(
      newStatus === "approved"
        ? "Quotation approved successfully."
        : "Quotation rejected. The Karigar can discuss the issue with you."
    );

    setActionLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            Loading booking...
          </div>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl bg-red-50 p-6 text-red-700">
            {error || "Booking not found."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/admin/bookings"
          className="text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          Back to bookings
        </Link>

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            MyKarigar
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Booking Details
          </h1>
        </div>

        {message && (
          <div className="mt-6 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
            {message}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Service
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Electrician
              </h2>

              <p className="mt-2 text-slate-600">
                {booking.problem}
              </p>
            </div>

            <span className="h-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-700">
              {booking.status.replaceAll("_", " ")}
            </span>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Customer
              </p>

              <p className="mt-1 text-slate-700">
                {booking.customer_name}
              </p>

              <p className="text-sm text-slate-500">
                {booking.customer_phone}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">
                Preferred time
              </p>

              <p className="mt-1 text-slate-700">
                {new Date(
                  booking.preferred_time
                ).toLocaleString()}
              </p>
            </div>

            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Service address
              </p>

              <p className="mt-1 text-slate-700">
                {booking.address}
              </p>
            </div>
          </div>
        </div>

        {karigar && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Your Karigar
            </p>

            <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  {karigar.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {karigar.service} - {karigar.area}
                </p>

                <p className="mt-2 text-sm text-slate-600">
                  {karigar.experience} years experience
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-900">
                  Rating {karigar.rating}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {karigar.jobs_completed} jobs completed
                </p>
              </div>
            </div>
          </div>
        )}

        {quote && (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Quotation
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  Service quotation
                </h2>
              </div>

              <span className="rounded-full bg-yellow-50 px-3 py-1 text-sm font-semibold capitalize text-yellow-700">
                {quote.status}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between gap-4">
                <span className="text-slate-600">
                  Labour
                </span>

                <span className="font-semibold text-slate-900">
                  Rs. {quote.labour_cost}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-600">
                  Parts
                </span>

                <span className="font-semibold text-slate-900">
                  Rs. {quote.parts_cost}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex justify-between gap-4">
                  <span className="font-semibold text-slate-900">
                    Total
                  </span>

                  <span className="text-2xl font-bold text-slate-900">
                    Rs. {quote.total}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Work description
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-700">
                {quote.description}
              </p>
            </div>

            {quote.warranty && (
              <div className="mt-4 rounded-xl bg-green-50 p-4">
                <p className="text-xs font-semibold uppercase text-green-600">
                  Warranty
                </p>

                <p className="mt-1 text-sm font-medium text-green-800">
                  {quote.warranty}
                </p>
              </div>
            )}

            {quote.status === "pending" &&
              booking.status === "quotation_pending" && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() =>
                      updateQuoteStatus("rejected")
                    }
                    disabled={actionLoading}
                    className="rounded-lg border border-red-300 px-4 py-3 font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Reject Quotation
                  </button>

                  <button
                    onClick={() =>
                      updateQuoteStatus("approved")
                    }
                    disabled={actionLoading}
                    className="rounded-lg bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading
                      ? "Updating..."
                      : "Approve Quotation"}
                  </button>
                </div>
              )}

            {quote.status === "approved" && (
              <div className="mt-6 rounded-xl bg-green-50 p-4">
                <p className="font-semibold text-green-800">
                  Quotation approved
                </p>

                <p className="mt-1 text-sm text-green-700">
                  The Karigar can now complete the job.
                </p>
              </div>
            )}

            {quote.status === "rejected" && (
              <div className="mt-6 rounded-xl bg-red-50 p-4">
                <p className="font-semibold text-red-800">
                  Quotation rejected
                </p>

                <p className="mt-1 text-sm text-red-700">
                  The Karigar can discuss the quotation with you.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
