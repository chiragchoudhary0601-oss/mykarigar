"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  problem: string;
  address: string;
  preferred_time: string;
  status: string;
  karigar_id: string | null;
  service_id: string;
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
};

type Review = {
  id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
};

type Karigar = {
  id: string;
  name: string;
  service: string;
};

type Service = {
  id: string;
  name: string;
};

export default function CustomerBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [processingQuoteId, setProcessingQuoteId] = useState<string | null>(
    null
  );

  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("GET USER ERROR:", userError);
    }

    if (!user) {
      router.push("/login");
      setLoading(false);
      return;
    }

    const [bookingsResult, karigarsResult, servicesResult] =
      await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, customer_id, customer_name, customer_phone, problem, address, preferred_time, status, karigar_id, service_id"
          )
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false }),

        supabase
          .from("karigars")
          .select("id, name, service")
          .eq("verified", true),

        supabase.from("services").select("id, name"),
      ]);

    if (bookingsResult.error) {
      console.error("BOOKINGS ERROR:", bookingsResult.error);
      setError("Unable to load your bookings.");
      setLoading(false);
      return;
    }

    if (karigarsResult.error) {
      console.error("KARIGARS ERROR:", karigarsResult.error);
    }

    if (servicesResult.error) {
      console.error("SERVICES ERROR:", servicesResult.error);
    }

    const loadedBookings = bookingsResult.data ?? [];
    const bookingIds = loadedBookings.map((booking) => booking.id);

    let loadedQuotes: Quote[] = [];
    let loadedReviews: Review[] = [];

    if (bookingIds.length > 0) {
      const [quotesResult, reviewsResult] = await Promise.all([
        supabase
          .from("quotes")
          .select(
            "id, booking_id, karigar_id, labour_cost, parts_cost, total, description, warranty, status"
          )
          .in("booking_id", bookingIds)
          .order("created_at", { ascending: false }),

        supabase
          .from("reviews")
          .select("id, booking_id, rating, comment")
          .in("booking_id", bookingIds),
      ]);

      if (quotesResult.error) {
        console.error("QUOTES ERROR:", quotesResult.error);
      } else {
        loadedQuotes = quotesResult.data ?? [];
      }

      if (reviewsResult.error) {
        console.error("REVIEWS ERROR:", reviewsResult.error);
      } else {
        loadedReviews = reviewsResult.data ?? [];
      }
    }

    setBookings(loadedBookings);
    setQuotes(loadedQuotes);
    setReviews(loadedReviews);
    setKarigars(karigarsResult.data ?? []);
    setServices(servicesResult.data ?? []);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    void Promise.resolve().then(loadData);
  }, [loadData]);

  function getQuoteForBooking(bookingId: string) {
    return quotes.find((quote) => quote.booking_id === bookingId);
  }

  function getReviewForBooking(bookingId: string) {
    return reviews.find((review) => review.booking_id === bookingId);
  }

  function getKarigar(karigarId: string | null) {
    if (!karigarId) return null;

    return karigars.find((karigar) => karigar.id === karigarId) ?? null;
  }

  function getService(serviceId: string) {
    return (
      services.find((service) => service.id === serviceId)?.name ??
      "Service"
    );
  }

  async function approveQuote(quote: Quote) {
    const booking = bookings.find(
      (currentBooking) => currentBooking.id === quote.booking_id
    );

    if (!booking) {
      setError("Could not find this booking.");
      return;
    }

    setProcessingQuoteId(quote.id);
    setMessage("");
    setError("");

    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        status: "approved",
      })
      .eq("id", quote.id)
      .eq("booking_id", booking.id);

    if (quoteError) {
      console.error("APPROVE QUOTE ERROR:", quoteError);
      setError(`Could not approve quote: ${quoteError.message}`);
      setProcessingQuoteId(null);
      return;
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: "quotation_approved",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .eq("customer_id", booking.customer_id);

    if (bookingError) {
      console.error("APPROVE BOOKING ERROR:", bookingError);
      setError(`Could not update booking: ${bookingError.message}`);
      setProcessingQuoteId(null);
      return;
    }

    setMessage("Quote approved successfully.");

    await loadData();

    setProcessingQuoteId(null);
  }

  async function rejectQuote(quote: Quote) {
    const booking = bookings.find(
      (currentBooking) => currentBooking.id === quote.booking_id
    );

    if (!booking) {
      setError("Could not find this booking.");
      return;
    }

    setProcessingQuoteId(quote.id);
    setMessage("");
    setError("");

    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        status: "rejected",
      })
      .eq("id", quote.id)
      .eq("booking_id", booking.id);

    if (quoteError) {
      console.error("REJECT QUOTE ERROR:", quoteError);
      setError(`Could not reject quote: ${quoteError.message}`);
      setProcessingQuoteId(null);
      return;
    }

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .eq("customer_id", booking.customer_id);

    if (bookingError) {
      console.error("REJECT BOOKING ERROR:", bookingError);
      setError(`Could not update booking: ${bookingError.message}`);
      setProcessingQuoteId(null);
      return;
    }

    setMessage("Quote rejected. The Karigar can review the job again.");

    await loadData();

    setProcessingQuoteId(null);
  }

  function openReview(bookingId: string) {
    setReviewBookingId(bookingId);
    setReviewRating(5);
    setReviewComment("");
    setMessage("");
    setError("");
  }

  function cancelReview() {
    setReviewBookingId(null);
    setReviewRating(5);
    setReviewComment("");
  }

  async function submitReview(booking: Booking) {
    if (!booking.karigar_id) {
      setError("This booking does not have an assigned Karigar.");
      return;
    }

    if (reviewRating < 1 || reviewRating > 5) {
      setError("Please select a rating from 1 to 5 stars.");
      return;
    }

    setSubmittingReview(true);
    setMessage("");
    setError("");

    const existingReview = getReviewForBooking(booking.id);

    if (existingReview) {
      setError("You have already reviewed this booking.");
      setSubmittingReview(false);
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      booking_id: booking.id,
      customer_id: booking.customer_id,
      karigar_id: booking.karigar_id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });

    if (error) {
      console.error("SUBMIT REVIEW ERROR:", error);
      setError(`Could not submit review: ${error.message}`);
      setSubmittingReview(false);
      return;
    }

    setMessage("Thank you! Your review has been submitted.");

    cancelReview();

    await loadData();

    setSubmittingReview(false);
  }

  function statusClasses(status: string) {
    switch (status) {
      case "completed":
        return "bg-green-50 text-green-700";

      case "quotation_approved":
        return "bg-emerald-50 text-emerald-700";

      case "quotation_pending":
        return "bg-amber-50 text-amber-700";

      case "cancelled":
        return "bg-red-50 text-red-700";

      case "assigned":
      case "accepted":
      case "on_the_way":
      case "in_progress":
        return "bg-blue-50 text-blue-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function statusLabel(status: string) {
    return status.replaceAll("_", " ");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/customer/services"
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
          >
            ← Back to services
          </Link>

          <Link
            href="/customer/services"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + Book Service
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Page heading */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            MyKarigar
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            My Bookings
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Track your service requests, quotations and completed jobs.
          </p>
        </div>

        {/* Messages */}
        {message && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
            <p className="text-sm font-medium text-green-700">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-6">
            {[1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6"
              >
                <div className="h-4 w-28 rounded bg-slate-200" />
                <div className="mt-4 h-6 w-64 rounded bg-slate-200" />
                <div className="mt-3 h-4 w-40 rounded bg-slate-100" />
                <div className="mt-6 h-20 rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && bookings.length === 0 && (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-2xl">
              🔧
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-900">
              No bookings yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your service requests will appear here.
            </p>

            <Link
              href="/customer/services"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Book a Service
            </Link>
          </div>
        )}

        {/* Bookings */}
        {!loading && !error && bookings.length > 0 && (
          <div className="mt-8 space-y-6">
            {bookings.map((booking) => {
              const quote = getQuoteForBooking(booking.id);
              const review = getReviewForBooking(booking.id);
              const karigar = getKarigar(booking.karigar_id);
              const isReviewing = reviewBookingId === booking.id;

              return (
                <article
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* Booking header */}
                  <div className="border-b border-slate-100 p-6">
                    <div className="flex flex-col justify-between gap-4 sm:flex-row">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
                            {getService(booking.service_id)}
                          </span>

                          <span className="text-xs text-slate-400">
                            #{booking.id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <h2 className="mt-3 text-xl font-bold text-slate-900">
                          {booking.problem}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                          Requested by {booking.customer_name}
                        </p>
                      </div>

                      <span
                        className={`h-fit w-fit rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${statusClasses(
                          booking.status
                        )}`}
                      >
                        {statusLabel(booking.status)}
                      </span>
                    </div>

                    {/* Basic details */}
                    <div className="mt-6 grid gap-4 sm:grid-cols-2">
                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Preferred time
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {new Date(
                            booking.preferred_time
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Service address
                        </p>

                        <p className="mt-1 text-sm font-medium text-slate-700">
                          {booking.address}
                        </p>
                      </div>
                    </div>

                    {/* Karigar */}
                    {karigar && (
                      <div className="mt-4 flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-blue-700">
                          {karigar.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Your Karigar
                          </p>

                          <p className="mt-1 font-semibold text-slate-900">
                            {karigar.name}
                          </p>

                          <p className="text-sm text-slate-500">
                            {karigar.service}
                          </p>
                        </div>

                        <span className="ml-auto hidden rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700 sm:block">
                          Verified
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quote */}
                  {quote && (
                    <div className="border-b border-slate-100 p-6">
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                              Service quotation
                            </p>

                            <p className="mt-1 text-3xl font-bold text-slate-900">
                              ₹{quote.total}
                            </p>
                          </div>

                          <span className="h-fit w-fit rounded-full bg-white px-3 py-1.5 text-xs font-semibold capitalize text-slate-600">
                            {quote.status}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-white/70 p-3">
                            <p className="text-xs text-slate-500">
                              Labour
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                              ₹{quote.labour_cost}
                            </p>
                          </div>

                          <div className="rounded-xl bg-white/70 p-3">
                            <p className="text-xs text-slate-500">
                              Parts
                            </p>

                            <p className="mt-1 font-semibold text-slate-800">
                              ₹{quote.parts_cost}
                            </p>
                          </div>
                        </div>

                        {quote.description && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Work description
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-700">
                              {quote.description}
                            </p>
                          </div>
                        )}

                        {quote.warranty && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              Warranty
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {quote.warranty}
                            </p>
                          </div>
                        )}

                        {quote.status === "pending" &&
                          booking.status === "quotation_pending" && (
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                              <button
                                type="button"
                                onClick={() => approveQuote(quote)}
                                disabled={processingQuoteId === quote.id}
                                className="rounded-xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {processingQuoteId === quote.id
                                  ? "Processing..."
                                  : "Approve Quote"}
                              </button>

                              <button
                                type="button"
                                onClick={() => rejectQuote(quote)}
                                disabled={processingQuoteId === quote.id}
                                className="rounded-xl border border-red-200 bg-white px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Reject Quote
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Review */}
                  {booking.status === "completed" && booking.karigar_id && (
                    <div className="border-b border-slate-100 p-6">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                        {review ? (
                          <div>
                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                                  Review submitted
                                </p>

                                <p className="mt-1 font-semibold text-slate-900">
                                  Thank you for rating your Karigar.
                                </p>
                              </div>

                              <div
                                className="flex items-center gap-1"
                                aria-label={`${review.rating} out of 5 stars`}
                              >
                                {Array.from({ length: 5 }).map((_, index) => (
                                  <span
                                    key={index}
                                    className={
                                      index < review.rating
                                        ? "text-xl text-yellow-500"
                                        : "text-xl text-slate-300"
                                    }
                                  >
                                    ★
                                  </span>
                                ))}
                              </div>
                            </div>

                            {review.comment && (
                              <p className="mt-4 rounded-xl bg-white p-4 text-sm leading-6 text-slate-700">
                                “{review.comment}”
                              </p>
                            )}
                          </div>
                        ) : isReviewing ? (
                          <div>
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Rate your Karigar
                                </p>

                                <h3 className="mt-1 text-lg font-bold text-slate-900">
                                  How was your experience?
                                </h3>
                              </div>

                              <button
                                type="button"
                                onClick={cancelReview}
                                className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                              >
                                Cancel
                              </button>
                            </div>

                            <div className="mt-5">
                              <p className="text-sm font-medium text-slate-700">
                                Rating
                              </p>

                              <div
                                className="mt-2 flex flex-wrap gap-2"
                                role="radiogroup"
                                aria-label="Rating"
                              >
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <button
                                    key={rating}
                                    type="button"
                                    onClick={() => setReviewRating(rating)}
                                    aria-label={`${rating} star${
                                      rating > 1 ? "s" : ""
                                    }`}
                                    aria-pressed={reviewRating === rating}
                                    className={`rounded-lg border px-3 py-2 text-2xl transition ${
                                      rating <= reviewRating
                                        ? "border-yellow-300 bg-yellow-50 text-yellow-500"
                                        : "border-slate-200 bg-white text-slate-300"
                                    }`}
                                  >
                                    ★
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="mt-5">
                              <label
                                htmlFor={`review-${booking.id}`}
                                className="text-sm font-medium text-slate-700"
                              >
                                Comment
                              </label>

                              <textarea
                                id={`review-${booking.id}`}
                                value={reviewComment}
                                onChange={(e) =>
                                  setReviewComment(e.target.value)
                                }
                                rows={4}
                                placeholder="Tell us about your experience..."
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => submitReview(booking)}
                              disabled={submittingReview}
                              className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {submittingReview
                                ? "Submitting Review..."
                                : "Submit Review"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-green-600">
                                Job completed
                              </p>

                              <h3 className="mt-1 text-lg font-bold text-slate-900">
                                How was your experience?
                              </h3>

                              <p className="mt-1 text-sm text-slate-500">
                                Rate {karigar?.name ?? "your Karigar"}.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => openReview(booking.id)}
                              className="rounded-xl bg-yellow-500 px-5 py-3 font-semibold text-white transition hover:bg-yellow-600"
                            >
                              ★ Rate Karigar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Footer actions */}
                  <div className="flex flex-col gap-3 bg-slate-50 p-5 sm:flex-row sm:justify-between">
                    <Link
                      href={`/customer/bookings/${booking.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Booking Details →
                    </Link>

                    <Link
                      href="/customer/services"
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
                    >
                      Book Another Service
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 text-center text-sm text-slate-500">
          Need another service?{" "}
          <Link
            href="/customer/services"
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Browse services
          </Link>
        </div>
      </div>
    </main>
  );
}