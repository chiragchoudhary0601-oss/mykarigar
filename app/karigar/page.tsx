"use client";

import { useEffect, useMemo, useState } from "react";
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

type Booking = {
  id: string;
  customer_name: string;
  customer_phone: string;
  problem: string;
  address: string;
  preferred_time: string;
  status: string;
  created_at: string;
  service_id: string;
  karigar_id: string | null;
};

type Quote = {
  id: string;
  booking_id: string;
  karigar_id: string;
  labour_cost: number;
  parts_cost: number;
  total: number;
  description: string | null;
  warranty: string | null;
  status: string;
  created_at: string;
};

const statusLabels: Record<string, string> = {
  requested: "Requested",
  assigned: "Assigned",
  accepted: "Accepted",
  on_the_way: "On the way",
  in_progress: "In progress",
  quotation_pending: "Quote pending",
  quotation_approved: "Quote approved",
  completed: "Completed",
  cancelled: "Cancelled",
};

const nextStatus: Record<string, string> = {
  assigned: "accepted",
  accepted: "on_the_way",
  on_the_way: "in_progress",
};

export default function KarigarPage() {
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [selectedKarigarId, setSelectedKarigarId] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(
    null
  );

  const [quoteBooking, setQuoteBooking] = useState<Booking | null>(null);
  const [labourCost, setLabourCost] = useState("");
  const [partsCost, setPartsCost] = useState("");
  const [quoteDescription, setQuoteDescription] = useState("");
  const [warranty, setWarranty] = useState("");
  const [savingQuote, setSavingQuote] = useState(false);

  useEffect(() => {
    loadKarigars();
  }, []);

  useEffect(() => {
    if (selectedKarigarId) {
      loadJobs(selectedKarigarId);
    }
  }, [selectedKarigarId]);

  async function loadKarigars() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("karigars")
      .select(
        "id, name, phone, service, area, experience, rating, verified, jobs_completed"
      )
      .eq("verified", true)
      .order("name", { ascending: true });

    if (error) {
      console.error("KARIGAR LOAD ERROR:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    const list = data ?? [];

    setKarigars(list);

    if (list.length > 0) {
      setSelectedKarigarId(list[0].id);
    }

    setLoading(false);
  }

  async function loadJobs(karigarId: string) {
    setLoadingJobs(true);
    setError("");

    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, customer_name, customer_phone, problem, address, preferred_time, status, created_at, service_id, karigar_id"
      )
      .eq("karigar_id", karigarId)
      .order("created_at", { ascending: false });

    if (bookingError) {
      console.error("BOOKING LOAD ERROR:", bookingError);
      setError(bookingError.message);
      setLoadingJobs(false);
      return;
    }

    const bookingList = bookingData ?? [];

    setBookings(bookingList);

    if (bookingList.length === 0) {
      setQuotes([]);
      setLoadingJobs(false);
      return;
    }

    const bookingIds = bookingList.map((booking) => booking.id);

    const { data: quoteData, error: quoteError } = await supabase
      .from("quotes")
      .select(
        "id, booking_id, karigar_id, labour_cost, parts_cost, total, description, warranty, status, created_at"
      )
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: false });

    if (quoteError) {
      console.error("QUOTE LOAD ERROR:", quoteError);
      setError(quoteError.message);
      setQuotes([]);
    } else {
      setQuotes(quoteData ?? []);
    }

    setLoadingJobs(false);
  }

  const selectedKarigar = useMemo(
    () => karigars.find((karigar) => karigar.id === selectedKarigarId) ?? null,
    [karigars, selectedKarigarId]
  );

  function getQuoteForBooking(bookingId: string) {
    return quotes.find((quote) => quote.booking_id === bookingId) ?? null;
  }

  async function updateBookingStatus(booking: Booking, status: string) {
    setUpdatingBookingId(booking.id);
    setMessage("");
    setError("");

    const { error } = await supabase
      .from("bookings")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .eq("karigar_id", selectedKarigarId);

    if (error) {
      console.error("BOOKING STATUS ERROR:", error);
      setError(error.message);
      setUpdatingBookingId(null);
      return;
    }

    setMessage(
      `Booking updated to ${statusLabels[status] ?? status}.`
    );

    await loadJobs(selectedKarigarId);

    setUpdatingBookingId(null);
  }

  function openQuoteForm(booking: Booking) {
    const existingQuote = getQuoteForBooking(booking.id);

    setQuoteBooking(booking);
    setLabourCost(
      existingQuote ? String(existingQuote.labour_cost ?? 0) : ""
    );
    setPartsCost(existingQuote ? String(existingQuote.parts_cost ?? 0) : "");
    setQuoteDescription(existingQuote?.description ?? "");
    setWarranty(existingQuote?.warranty ?? "");
    setMessage("");
    setError("");
  }

  function closeQuoteForm() {
    setQuoteBooking(null);
    setLabourCost("");
    setPartsCost("");
    setQuoteDescription("");
    setWarranty("");
  }

  async function saveQuote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!quoteBooking || !selectedKarigarId) {
      return;
    }

    const labour = Number(labourCost || 0);
    const parts = Number(partsCost || 0);

    if (!Number.isFinite(labour) || labour < 0) {
      setError("Labour cost must be a valid number.");
      return;
    }

    if (!Number.isFinite(parts) || parts < 0) {
      setError("Parts cost must be a valid number.");
      return;
    }

    const total = labour + parts;

    if (total <= 0) {
      setError("Quote total must be greater than ₹0.");
      return;
    }

    setSavingQuote(true);
    setError("");
    setMessage("");

    const existingQuote = getQuoteForBooking(quoteBooking.id);

    if (existingQuote) {
      const { error } = await supabase
        .from("quotes")
        .update({
          labour_cost: labour,
          parts_cost: parts,
          total,
          description: quoteDescription.trim() || null,
          warranty: warranty.trim() || null,
          status: "pending",
        })
        .eq("id", existingQuote.id)
        .eq("karigar_id", selectedKarigarId);

      if (error) {
        console.error("QUOTE UPDATE ERROR:", error);
        setError(error.message);
        setSavingQuote(false);
        return;
      }
    } else {
      const { error } = await supabase.from("quotes").insert({
        booking_id: quoteBooking.id,
        karigar_id: selectedKarigarId,
        labour_cost: labour,
        parts_cost: parts,
        total,
        description: quoteDescription.trim() || null,
        warranty: warranty.trim() || null,
        status: "pending",
      });

      if (error) {
        console.error("QUOTE INSERT ERROR:", error);
        setError(error.message);
        setSavingQuote(false);
        return;
      }
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: "quotation_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", quoteBooking.id)
      .eq("karigar_id", selectedKarigarId);

    if (bookingError) {
      console.error("BOOKING QUOTE STATUS ERROR:", bookingError);
      setError(bookingError.message);
      setSavingQuote(false);
      return;
    }

    setMessage("Quote saved successfully.");

    closeQuoteForm();

    await loadJobs(selectedKarigarId);

    setSavingQuote(false);
  }

  async function completeJob(booking: Booking) {
    const quote = getQuoteForBooking(booking.id);

    if (!quote || quote.status !== "approved") {
      setError("Customer must approve the quote before the job can be completed.");
      return;
    }

    await updateBookingStatus(booking, "completed");
  }

  const assignedCount = bookings.filter(
    (booking) => booking.status === "assigned"
  ).length;

  const activeCount = bookings.filter((booking) =>
    ["accepted", "on_the_way", "in_progress"].includes(booking.status)
  ).length;

  const quoteCount = bookings.filter((booking) =>
    ["quotation_pending", "quotation_approved"].includes(booking.status)
  ).length;

  const completedCount = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <p className="text-slate-600">Loading Karigar dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600">
                MYKARIGAR
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Karigar Dashboard
              </h1>

              <p className="mt-2 text-slate-600">
                Manage assigned jobs and customer quotes.
              </p>
            </div>

            <a
              href="/"
              className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Website
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-700">{message}</p>
          </div>
        )}

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>


              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Select Karigar
              </h2>

              <p className="mt-1 text-sm text-slate-500">
  Manage assigned jobs and customer quotes.
</p>
            </div>

            <select
              value={selectedKarigarId}
              onChange={(e) => setSelectedKarigarId(e.target.value)}
              className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 lg:w-96"
            >
              {karigars.map((karigar) => (
                <option key={karigar.id} value={karigar.id}>
                  {karigar.name} — {karigar.service}
                </option>
              ))}
            </select>
          </div>
        </section>

        {selectedKarigar && (
          <>
            <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {selectedKarigar.name}
                    </h2>

                    {selectedKarigar.verified && (
                      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                        Verified
                      </span>
                    )}
                  </div>

                  <p className="mt-2 text-slate-600">
                    {selectedKarigar.service} · {selectedKarigar.area}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedKarigar.experience} years experience · ⭐{" "}
                    {selectedKarigar.rating} · {selectedKarigar.jobs_completed}{" "}
                    jobs completed
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedKarigar.phone}
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Assigned</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {assignedCount}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Active Jobs</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Quotes</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {quoteCount}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {completedCount}
                </p>
              </div>
            </section>

            <section className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Assigned Jobs
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Real bookings assigned to {selectedKarigar.name}.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadJobs(selectedKarigarId)}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>

              {loadingJobs && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-6">
                  <p className="text-slate-600">Loading jobs...</p>
                </div>
              )}

              {!loadingJobs && bookings.length === 0 && (
                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-center">
                  <p className="text-lg font-semibold text-slate-900">
                    No assigned jobs
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Assign a booking to {selectedKarigar.name} from the admin
                    dashboard.
                  </p>
                </div>
              )}

              {!loadingJobs && bookings.length > 0 && (
                <div className="mt-5 grid gap-5">
                  {bookings.map((booking) => {
                    const quote = getQuoteForBooking(booking.id);
                    const next = nextStatus[booking.status];

                    return (
                      <article
                        key={booking.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                {statusLabels[booking.status] ??
                                  booking.status}
                              </span>

                              <span className="text-xs font-medium text-slate-400">
                                #{booking.id.slice(0, 8)}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-bold text-slate-900">
                              {booking.customer_name}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              {booking.customer_phone}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                            <p className="text-slate-500">Requested time</p>
                            <p className="mt-1 font-semibold text-slate-900">
                              {new Date(
                                booking.preferred_time
                              ).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-5 md:grid-cols-2">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Problem
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {booking.problem}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                              Service Address
                            </p>

                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {booking.address}
                            </p>
                          </div>
                        </div>

                        {quote && (
                          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-bold text-slate-900">
                                  Quote
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {quote.status === "approved"
                                    ? "Customer approved this quote."
                                    : quote.status === "rejected"
                                      ? "Customer rejected this quote."
                                      : "Waiting for customer approval."}
                                </p>
                              </div>

                              <span className="text-2xl font-bold text-slate-900">
                                ₹{quote.total}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                              <div>
                                <span className="text-slate-500">
                                  Labour
                                </span>
                                <p className="font-semibold text-slate-900">
                                  ₹{quote.labour_cost}
                                </p>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Parts
                                </span>
                                <p className="font-semibold text-slate-900">
                                  ₹{quote.parts_cost}
                                </p>
                              </div>

                              <div>
                                <span className="text-slate-500">
                                  Status
                                </span>
                                <p className="font-semibold text-slate-900">
                                  {quote.status}
                                </p>
                              </div>
                            </div>

                            {quote.description && (
                              <p className="mt-4 text-sm leading-6 text-slate-600">
                                {quote.description}
                              </p>
                            )}

                            {quote.warranty && (
                              <p className="mt-2 text-sm text-slate-600">
                                Warranty: {quote.warranty}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3">
                          {next && (
                            <button
                              type="button"
                              onClick={() =>
                                updateBookingStatus(booking, next)
                              }
                              disabled={
                                updatingBookingId === booking.id
                              }
                              className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {updatingBookingId === booking.id
                                ? "Updating..."
                                : `Mark ${statusLabels[next]}`}
                            </button>
                          )}

                          {[
                            "in_progress",
                            "quotation_pending",
                            "quotation_approved",
                          ].includes(booking.status) && (
                            <button
                              type="button"
                              onClick={() => openQuoteForm(booking)}
                              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              {quote ? "Update Quote" : "Create Quote"}
                            </button>
                          )}

                          {booking.status === "quotation_approved" &&
                            quote?.status === "approved" && (
                              <button
                                type="button"
                                onClick={() => completeJob(booking)}
                                disabled={
                                  updatingBookingId === booking.id
                                }
                                className="rounded-lg bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Complete Job
                              </button>
                            )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {quoteBooking && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4">
          <div className="mx-auto mt-10 max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {getQuoteForBooking(quoteBooking.id)
                    ? "Update Quote"
                    : "Create Quote"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Customer: {quoteBooking.customer_name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeQuoteForm}
                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={saveQuote} className="mt-6 grid gap-5">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Labour Cost
                </label>

                <input
                  type="number"
                  min="0"
                  value={labourCost}
                  onChange={(e) => setLabourCost(e.target.value)}
                  placeholder="500"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Parts Cost
                </label>

                <input
                  type="number"
                  min="0"
                  value={partsCost}
                  onChange={(e) => setPartsCost(e.target.value)}
                  placeholder="300"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Description
                </label>

                <textarea
                  value={quoteDescription}
                  onChange={(e) => setQuoteDescription(e.target.value)}
                  rows={3}
                  placeholder="Repair details and included work"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Warranty
                </label>

                <input
                  type="text"
                  value={warranty}
                  onChange={(e) => setWarranty(e.target.value)}
                  placeholder="30 days"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Total</p>

                <p className="mt-1 text-2xl font-bold text-slate-900">
                  ₹
                  {(Number(labourCost || 0) + Number(partsCost || 0)).toFixed(
                    0
                  )}
                </p>
              </div>

              <button
                type="submit"
                disabled={savingQuote}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingQuote ? "Saving Quote..." : "Save Quote"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}