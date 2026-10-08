"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Logo from "@/components/Logo";

type Booking = {
  id: string;
  customer_id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  problem: string;
  address: string;
  preferred_time: string;
  status: string;
  karigar_id: string | null;
  created_at: string;
};

type Service = {
  id: string;
  name: string;
  description: string | null;
  base_price: number;
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

type Review = {
  id: string;
  rating: number;
  comment: string | null;
};

const STATUS_STEPS = [
  {
    key: "requested",
    label: "Booking requested",
    description: "Your service request has been received.",
  },
  {
    key: "assigned",
    label: "Karigar assigned",
    description: "A verified Karigar has been assigned.",
  },
  {
    key: "accepted",
    label: "Karigar accepted",
    description: "Your Karigar has accepted the job.",
  },
  {
    key: "on_the_way",
    label: "Karigar on the way",
    description: "Your Karigar is heading to your location.",
  },
  {
    key: "in_progress",
    label: "Job in progress",
    description: "The Karigar is working on your service.",
  },
  {
    key: "quotation_pending",
    label: "Quotation pending",
    description: "A quotation is waiting for your approval.",
  },
  {
    key: "quotation_approved",
    label: "Quotation approved",
    description: "You approved the service quotation.",
  },
  {
    key: "completed",
    label: "Job completed",
    description: "Your service has been completed.",
  },
];

function getStatusIndex(status: string) {
  const index = STATUS_STEPS.findIndex((step) => step.key === status);

  if (index !== -1) {
    return index;
  }

  if (status === "cancelled") {
    return -1;
  }

  return 0;
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) =>
    letter.toUpperCase()
  );
}

function formatDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusStyles(status: string) {
  if (status === "completed") {
    return "bg-green-100 text-green-700";
  }

  if (status === "cancelled") {
    return "bg-red-100 text-red-700";
  }

if (status === "quotation_pending") {
  return "bg-yellow-100 text-yellow-800";
}
  if (status === "quotation_approved") {
    return "bg-green-100 text-green-700";
  }

  return "bg-blue-100 text-blue-700";
}

export default function CustomerBookingDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [karigar, setKarigar] = useState<Karigar | null>(null);
  const [review, setReview] = useState<Review | null>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooking() {
      setLoading(true);
      setError("");
      setMessage("");

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

      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .select(
          "id, customer_id, service_id, customer_name, customer_phone, problem, address, preferred_time, status, karigar_id, created_at"
        )
        .eq("id", bookingId)
        .eq("customer_id", user.id)
        .single();

      if (bookingError || !bookingData) {
        console.error("BOOKING ERROR:", bookingError);
        setError("Unable to load this booking.");
        setLoading(false);
        return;
      }

      setBooking(bookingData);

      const { data: serviceData, error: serviceError } = await supabase
        .from("services")
        .select("id, name, description, base_price")
        .eq("id", bookingData.service_id)
        .maybeSingle();

      if (serviceError) {
        console.error("SERVICE ERROR:", serviceError);
      }

      setService(serviceData || null);

      if (bookingData.karigar_id) {
        const { data: karigarData, error: karigarError } = await supabase
          .from("karigars")
          .select(
            "id, name, phone, service, area, experience, rating, jobs_completed"
          )
          .eq("id", bookingData.karigar_id)
          .single();

        if (karigarError) {
          console.error("KARIGAR ERROR:", karigarError);
        }

        setKarigar(karigarData || null);
      } else {
        setKarigar(null);
      }

      const { data: quoteData, error: quoteError } = await supabase
        .from("quotes")
        .select(
          "id, labour_cost, parts_cost, total, description, warranty, status"
        )
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (quoteError) {
        console.error("QUOTE ERROR:", quoteError);
      }

      setQuote(quoteData || null);

      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (reviewError) {
        console.error("REVIEW ERROR:", reviewError);
      }

      setReview(reviewData || null);

      if (reviewData) {
        setRating(reviewData.rating);
        setComment(reviewData.comment || "");
      }

      setLoading(false);
    }

    if (bookingId) {
      loadBooking();
    }
  }, [bookingId, router]);

  async function updateQuoteStatus(
    newStatus: "approved" | "rejected"
  ) {
    if (!quote || !booking) {
      return;
    }

    setActionLoading(true);
    setMessage("");
    setError("");

    const { error: quoteError } = await supabase
      .from("quotes")
      .update({
        status: newStatus,
      })
      .eq("id", quote.id)
      .eq("booking_id", booking.id);

    if (quoteError) {
      console.error("QUOTE UPDATE ERROR:", quoteError);
      setError("Unable to update quotation.");
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
      .eq("id", booking.id)
      .eq("customer_id", booking.customer_id);

    if (bookingError) {
      console.error("BOOKING STATUS ERROR:", bookingError);

      setError(
        "Quotation was updated, but the booking status could not be updated."
      );

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

  async function submitReview() {
    if (!booking) {
      return;
    }

    if (!booking.karigar_id) {
      setMessage("No Karigar is assigned to this booking.");
      return;
    }

    if (booking.status !== "completed") {
      setMessage("You can review this booking after it is completed.");
      return;
    }

    if (rating < 1 || rating > 5) {
      setMessage("Please select a rating from 1 to 5 stars.");
      return;
    }

    setReviewSubmitting(true);
    setMessage("");
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: existingReview, error: existingReviewError } =
      await supabase
        .from("reviews")
        .select("id")
        .eq("booking_id", booking.id)
        .eq("customer_id", user.id)
        .maybeSingle();

    if (existingReviewError) {
      console.error(existingReviewError);
      setError("Unable to check existing review.");
      setReviewSubmitting(false);
      return;
    }

    if (existingReview) {
      setMessage("You have already reviewed this booking.");
      setReviewSubmitting(false);
      return;
    }

    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        booking_id: booking.id,
        customer_id: user.id,
        karigar_id: booking.karigar_id,
        rating,
        comment: comment.trim() || null,
      })
      .select("id, rating, comment")
      .single();

    if (reviewError) {
      console.error("REVIEW INSERT ERROR:", reviewError);
      setError("Unable to submit your review.");
      setReviewSubmitting(false);
      return;
    }

    setReview(reviewData);
    setMessage("Thank you! Your review has been submitted.");
    setReviewSubmitting(false);
  }

  const statusIndex = useMemo(
    () => getStatusIndex(booking?.status || ""),
    [booking?.status]
  );

  const isCancelled = booking?.status === "cancelled";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Logo />

            <div className="h-9 w-28 animate-pulse rounded-lg bg-slate-100" />
          </div>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

          <div className="mt-5 rounded-3xl bg-slate-900 p-6 sm:p-8">
            <div className="h-4 w-40 animate-pulse rounded bg-slate-700" />
            <div className="mt-4 h-9 w-64 animate-pulse rounded bg-slate-700" />
            <div className="mt-4 h-5 w-80 max-w-full animate-pulse rounded bg-slate-700" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
            <div className="h-96 animate-pulse rounded-2xl bg-white" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !booking) {
    return (
      <main className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/customer/services">
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

        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <Link
            href="/customer/bookings"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to bookings
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl">
              !
            </div>

            <h1 className="mt-4 text-xl font-bold text-red-900">
              Booking unavailable
            </h1>

            <p className="mt-2 text-sm leading-6 text-red-700">
              {error || "Booking not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/customer/services" aria-label="MyKarigar home">
            <Logo />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/customer/services"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:inline-flex"
            >
              Book a service
            </Link>

            <Link
              href="/customer/bookings"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:px-4"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <Link
          href="/customer/bookings"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          ← Back to bookings
        </Link>

        {/* Hero */}
        <section className="mt-5 overflow-hidden rounded-3xl bg-slate-900 shadow-sm">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-400">
                  Booking #{booking.id.slice(0, 8).toUpperCase()}
                </p>

                <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {service?.name || "Service Booking"}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  {booking.problem}
                </p>
              </div>

              <span
                className={`w-fit shrink-0 rounded-full px-4 py-2 text-sm font-bold ${getStatusStyles(
                  booking.status
                )}`}
              >
                {formatStatus(booking.status)}
              </span>
            </div>

            <div className="mt-7 grid gap-4 border-t border-slate-700 pt-6 sm:grid-cols-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Starting price
                </p>

                <p className="mt-1 text-xl font-black text-white">
                  ₹{service?.base_price ?? "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Preferred time
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {formatDate(booking.preferred_time)}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Requested
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-200">
                  {formatDate(booking.created_at)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-semibold text-green-800">{message}</p>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-800">{error}</p>
          </div>
        )}

        {/* Main content */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
          {/* Left */}
          <div className="space-y-6">
            {/* Timeline */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                Track your booking
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Service progress
              </h2>

              {isCancelled ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                  <p className="font-bold text-red-800">
                    Booking cancelled
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    This booking is no longer active.
                  </p>
                </div>
              ) : (
                <div className="mt-7">
                  {STATUS_STEPS.map((step, index) => {
                    const completed = index < statusIndex;
                    const current = index === statusIndex;

                    return (
                      <div
                        key={step.key}
                        className="relative flex gap-4 pb-7 last:pb-0"
                      >
                        {index < STATUS_STEPS.length - 1 && (
                          <div
                            className={`absolute left-[15px] top-8 h-full w-0.5 ${
                              index < statusIndex
                                ? "bg-blue-600"
                                : "bg-slate-200"
                            }`}
                          />
                        )}

                        <div
                          className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            completed
                              ? "bg-blue-600 text-white"
                              : current
                                ? "bg-blue-100 text-blue-700 ring-4 ring-blue-50"
                                : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {completed || current ? "✓" : index + 1}
                        </div>

                        <div className="min-w-0 pt-0.5">
                          <p
                            className={`font-semibold ${
                              current || completed
                                ? "text-slate-900"
                                : "text-slate-400"
                            }`}
                          >
                            {step.label}
                          </p>

                          <p
                            className={`mt-1 text-sm ${
                              current || completed
                                ? "text-slate-500"
                                : "text-slate-400"
                            }`}
                          >
                            {step.description}
                          </p>

                          {current && (
                            <span className="mt-2 inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                              Current status
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Quote */}
            {quote && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                      Quotation
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                      Service quotation
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Review the final service cost before work continues.
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-sm font-bold ${
                      quote.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : quote.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {formatStatus(quote.status)}
                  </span>
                </div>

                <div className="mt-7 rounded-2xl bg-slate-50 p-5">
                  <div className="space-y-4">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-600">Labour</span>
                      <span className="font-bold text-slate-900">
                        ₹{quote.labour_cost}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-slate-600">Parts</span>
                      <span className="font-bold text-slate-900">
                        ₹{quote.parts_cost}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-lg font-bold text-slate-900">
                        Total
                      </span>

                      <span className="text-3xl font-black text-slate-900">
                        ₹{quote.total}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                    Work description
                  </p>

                  <p className="mt-2 leading-6 text-slate-700">
                    {quote.description}
                  </p>
                </div>

                {quote.warranty && (
                  <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-5">
                    <p className="text-xs font-black uppercase tracking-wide text-green-600">
                      Warranty
                    </p>

                    <p className="mt-1 font-bold text-green-800">
                      {quote.warranty}
                    </p>
                  </div>
                )}

                {quote.status === "pending" &&
                  booking.status === "quotation_pending" && (
                    <div className="mt-6">
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <p className="font-bold text-yellow-900">
                          Your approval is required
                        </p>

                        <p className="mt-1 text-sm leading-6 text-yellow-800">
                          Please review the quotation before the Karigar
                          continues the work.
                        </p>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => updateQuoteStatus("rejected")}
                          disabled={actionLoading}
                          className="rounded-xl border border-red-300 px-4 py-3 font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading
                            ? "Updating..."
                            : "Reject Quotation"}
                        </button>

                        <button
                          type="button"
                          onClick={() => updateQuoteStatus("approved")}
                          disabled={actionLoading}
                          className="rounded-xl bg-green-600 px-4 py-3 font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading
                            ? "Updating..."
                            : `Approve ₹${quote.total}`}
                        </button>
                      </div>
                    </div>
                  )}

                {quote.status === "approved" && (
                  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                    <p className="font-bold text-green-800">
                      ✓ Quotation approved
                    </p>

                    <p className="mt-1 text-sm leading-6 text-green-700">
                      You approved ₹{quote.total}. The Karigar can now
                      continue and complete the job.
                    </p>
                  </div>
                )}

                {quote.status === "rejected" && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
                    <p className="font-bold text-red-800">
                      Quotation rejected
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-700">
                      The quotation was rejected. The Karigar can discuss
                      the required work and pricing with you.
                    </p>
                  </div>
                )}
              </section>
            )}

            {!quote &&
              karigar &&
              ["in_progress", "quotation_pending"].includes(
                booking.status
              ) && (
                <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
                  <p className="font-bold text-yellow-900">
                    Quotation being prepared
                  </p>

                  <p className="mt-1 text-sm leading-6 text-yellow-800">
                    Your Karigar is preparing the service quotation. It
                    will appear here when it is ready.
                  </p>
                </section>
              )}

            {/* Review */}
            {booking.status === "completed" && karigar && (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                  Service completed
                </p>

                <h2 className="mt-1 text-2xl font-black text-slate-900">
                  {review ? "Your review" : "Rate your Karigar"}
                </h2>

                {!review ? (
                  <>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      How was your experience with {karigar.name}? Your
                      feedback helps other customers choose trusted
                      professionals.
                    </p>

                    <div className="mt-6">
                      <p className="text-sm font-bold text-slate-700">
                        Your rating
                      </p>

                      <div
                        className="mt-3 flex gap-1"
                        role="radiogroup"
                        aria-label="Rating from 1 to 5 stars"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            aria-label={`${star} star${
                              star > 1 ? "s" : ""
                            }`}
                            className={`rounded-lg px-1 text-4xl transition ${
                              star <= rating
                                ? "text-yellow-400"
                                : "text-slate-300"
                            } hover:text-yellow-400`}
                          >
                            ★
                          </button>
                        ))}
                      </div>

                      {rating > 0 && (
                        <p className="mt-2 text-sm font-medium text-slate-600">
                          You selected {rating} out of 5
                        </p>
                      )}
                    </div>

                    <div className="mt-6">
                      <label
                        htmlFor="review-comment"
                        className="block text-sm font-bold text-slate-700"
                      >
                        Review
                      </label>

                      <textarea
                        id="review-comment"
                        rows={4}
                        value={comment}
                        onChange={(event) =>
                          setComment(event.target.value)
                        }
                        placeholder="Tell us about your service experience..."
                        className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={reviewSubmitting}
                      className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {reviewSubmitting
                        ? "Submitting review..."
                        : "Submit Review"}
                    </button>
                  </>
                ) : (
                  <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5">
                    <p className="font-bold text-green-800">
                      ✓ Thank you for your review!
                    </p>

                    <div className="mt-3 flex items-center gap-1 text-2xl text-yellow-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star}>
                          {star <= review.rating ? "★" : "☆"}
                        </span>
                      ))}
                    </div>

                    <p className="mt-2 text-sm font-bold text-green-800">
                      {review.rating}/5 rating
                    </p>

                    {review.comment && (
                      <p className="mt-4 rounded-lg bg-white/70 p-4 text-sm leading-6 text-green-900">
                        “{review.comment}”
                      </p>
                    )}
                  </div>
                )}
              </section>
            )}
          </div>

          {/* Right */}
          <div className="space-y-6">
            {/* Service details */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Service details
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                {service?.name || "Service"}
              </h2>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Problem
                  </p>

                  <p className="mt-1 leading-6 text-slate-700">
                    {booking.problem}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Service address
                  </p>

                  <p className="mt-1 leading-6 text-slate-700">
                    {booking.address}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Preferred time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-700">
                    {formatDate(booking.preferred_time)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Customer
                  </p>

                  <p className="mt-1 font-semibold text-slate-700">
                    {booking.customer_name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {booking.customer_phone}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Booking ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-500">
                    {booking.id}
                  </p>
                </div>
              </div>
            </section>

            {/* Karigar */}
            {karigar ? (
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-wider text-blue-600">
                      Your Karigar
                    </p>

                    <h2 className="mt-1 text-2xl font-black text-slate-900">
                      {karigar.name}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {karigar.service} · {karigar.area}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700">
                    ✓ Verified
                  </span>
                </div>

                <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Rating
                      </p>

                      <p className="mt-1 text-xl font-black text-slate-900">
                        ⭐ {karigar.rating}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Completed
                      </p>

                      <p className="mt-1 text-xl font-black text-slate-900">
                        {karigar.jobs_completed}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Experience
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {karigar.experience} years
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase text-slate-400">
                      Service
                    </p>

                    <p className="mt-1 font-bold text-slate-900">
                      {karigar.service}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${karigar.phone}`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                  📞 Call {karigar.name}
                </a>
              </section>
            ) : (
              <section className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl">
                  🔧
                </div>

                <p className="mt-4 font-bold text-blue-900">
                  Finding your Karigar
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-700">
                  Your request has been received. A verified local
                  professional will be assigned to your booking.
                </p>
              </section>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link
            href="/customer/services"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-center font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Book another service
          </Link>

          <Link
            href="/customer/bookings"
            className="rounded-xl bg-slate-900 px-4 py-3 text-center font-bold text-white transition hover:bg-slate-800"
          >
            View all bookings
          </Link>
        </div>

        <footer className="py-10 text-center text-sm text-slate-400">
          <p>MyKarigar · Trusted local professionals</p>
        </footer>
      </div>
    </main>
  );
}