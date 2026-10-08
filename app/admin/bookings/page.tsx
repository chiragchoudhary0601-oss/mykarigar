"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type BookingStatus =
  | "requested"
  | "assigned"
  | "accepted"
  | "on_the_way"
  | "in_progress"
  | "quotation_pending"
  | "quotation_approved"
  | "completed"
  | "cancelled";

type Booking = {
  id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  problem: string;
  address: string;
  preferred_time: string;
  status: BookingStatus;
  karigar_id: string | null;
  service_id: string;
  created_at?: string;
};

type Service = {
  id: string;
  name: string;
};

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

const statusLabels: Record<BookingStatus, string> = {
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

function getStatusClasses(status: BookingStatus) {
  switch (status) {
    case "requested":
      return "bg-amber-50 text-amber-700 ring-amber-200";
    case "assigned":
      return "bg-blue-50 text-blue-700 ring-blue-200";
    case "accepted":
      return "bg-indigo-50 text-indigo-700 ring-indigo-200";
    case "on_the_way":
      return "bg-cyan-50 text-cyan-700 ring-cyan-200";
    case "in_progress":
      return "bg-purple-50 text-purple-700 ring-purple-200";
    case "quotation_pending":
      return "bg-orange-50 text-orange-700 ring-orange-200";
    case "quotation_approved":
      return "bg-teal-50 text-teal-700 ring-teal-200";
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-200";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200";
  }
}

function getServiceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "M";
}

function formatDate(value: string) {
  if (!value) return "Not specified";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [karigars, setKarigars] = useState<Karigar[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [statusFilter, setStatusFilter] = useState<
    "all" | BookingStatus
  >("all");

  const [serviceFilter, setServiceFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedKarigar, setSelectedKarigar] = useState<
    Record<string, string>
  >({});

  const [assigningBookingId, setAssigningBookingId] = useState<string | null>(
    null
  );

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(
    null
  );

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    const [bookingsResult, servicesResult, karigarsResult] =
      await Promise.all([
        supabase
          .from("bookings")
          .select(
            "id, customer_id, customer_name, customer_phone, problem, address, preferred_time, status, karigar_id, service_id, created_at"
          )
          .order("created_at", { ascending: false }),

        supabase
          .from("services")
          .select("id, name")
          .order("name", { ascending: true }),

        supabase
          .from("karigars")
          .select(
            "id, name, phone, service, area, experience, rating, verified, jobs_completed"
          )
          .eq("verified", true)
          .order("rating", { ascending: false }),
      ]);

    if (bookingsResult.error) {
      console.error("ADMIN BOOKINGS ERROR:", bookingsResult.error);
      setError(`Unable to load bookings: ${bookingsResult.error.message}`);
    } else {
      setBookings((bookingsResult.data ?? []) as Booking[]);
    }

    if (servicesResult.error) {
      console.error("ADMIN SERVICES ERROR:", servicesResult.error);
    } else {
      setServices((servicesResult.data ?? []) as Service[]);
    }

    if (karigarsResult.error) {
      console.error("ADMIN KARIGARS ERROR:", karigarsResult.error);
    } else {
      setKarigars((karigarsResult.data ?? []) as Karigar[]);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const serviceMap = useMemo(() => {
    return new Map(services.map((service) => [service.id, service.name]));
  }, [services]);

  const karigarMap = useMemo(() => {
    return new Map(karigars.map((karigar) => [karigar.id, karigar]));
  }, [karigars]);

  const stats = useMemo(() => {
    return {
      total: bookings.length,
      requested: bookings.filter((booking) => booking.status === "requested")
        .length,
      assigned: bookings.filter((booking) => booking.status === "assigned")
        .length,
      active: bookings.filter((booking) =>
        ["accepted", "on_the_way", "in_progress", "quotation_pending"].includes(
          booking.status
        )
      ).length,
      completed: bookings.filter(
        (booking) => booking.status === "completed"
      ).length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const serviceName = serviceMap.get(booking.service_id) ?? "Service";

      const matchesStatus =
        statusFilter === "all" || booking.status === statusFilter;

      const matchesService =
        serviceFilter === "all" || booking.service_id === serviceFilter;

      const matchesSearch =
        !normalizedSearch ||
        booking.customer_name.toLowerCase().includes(normalizedSearch) ||
        booking.customer_phone.toLowerCase().includes(normalizedSearch) ||
        booking.problem.toLowerCase().includes(normalizedSearch) ||
        booking.address.toLowerCase().includes(normalizedSearch) ||
        serviceName.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesService && matchesSearch;
    });
  }, [bookings, search, serviceFilter, serviceMap, statusFilter]);

  function getMatchingKarigars(serviceId: string) {
    const serviceName = serviceMap.get(serviceId);

    if (!serviceName) {
      return [];
    }

    return karigars.filter(
      (karigar) =>
        karigar.verified &&
        karigar.service.toLowerCase() === serviceName.toLowerCase()
    );
  }

  async function assignKarigar(booking: Booking) {
    const karigarId = selectedKarigar[booking.id];

    if (!karigarId) {
      setError("Please select a Karigar first.");
      setMessage("");
      return;
    }

    setAssigningBookingId(booking.id);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        karigar_id: karigarId,
        status: "assigned",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("ASSIGN KARIGAR ERROR:", updateError);
      setError(`Could not assign Karigar: ${updateError.message}`);
      setAssigningBookingId(null);
      return;
    }

    const karigar = karigarMap.get(karigarId);

    setMessage(
      `${karigar?.name ?? "Karigar"} has been assigned to ${booking.customer_name}'s booking.`
    );

    setSelectedKarigar((current) => {
      const next = { ...current };
      delete next[booking.id];
      return next;
    });

    await loadData(true);

    setAssigningBookingId(null);
  }

  async function cancelBooking(booking: Booking) {
    const confirmed = window.confirm(
      `Cancel the booking from ${booking.customer_name}?`
    );

    if (!confirmed) {
      return;
    }

    setCancellingBookingId(booking.id);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("CANCEL BOOKING ERROR:", updateError);
      setError(`Could not cancel booking: ${updateError.message}`);
      setCancellingBookingId(null);
      return;
    }

    setMessage(`Booking from ${booking.customer_name} was cancelled.`);

    await loadData(true);

    setCancellingBookingId(null);
  }

  function clearFilters() {
    setStatusFilter("all");
    setServiceFilter("all");
    setSearch("");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Top navigation */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-black text-white shadow-sm">
              M
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">
                MyKarigar
              </p>
              <p className="text-xs font-medium text-slate-500">
                Admin dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/customer/services"
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 sm:block"
            >
              View customer site
            </Link>

            <button
              type="button"
              onClick={() => void loadData(true)}
              disabled={refreshing}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Page heading */}
        <div className="mb-7">
          <p className="text-sm font-semibold text-blue-600">
            Operations
          </p>

          <div className="mt-1 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Booking Management
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Review customer requests, assign verified Karigars, and
                monitor every job from one place.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Showing
              </p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {filteredBookings.length}
                <span className="ml-1 text-sm font-medium text-slate-400">
                  bookings
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
              ✓
            </div>

            <p className="text-sm font-medium leading-6 text-emerald-800">
              {message}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white">
              !
            </div>

            <p className="text-sm font-medium leading-6 text-red-800">
              {error}
            </p>
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Total bookings</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-700">Requested</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">
              {stats.requested}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-700">Assigned</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {stats.assigned}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
            <p className="text-sm font-medium text-purple-700">Active jobs</p>
            <p className="mt-2 text-3xl font-bold text-purple-900">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Completed</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {stats.completed}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <label
                htmlFor="booking-search"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Search
              </label>

              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  ⌕
                </span>

                <input
                  id="booking-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customer, phone, service, problem..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-9 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="w-full lg:w-48">
              <label
                htmlFor="status-filter"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as "all" | BookingStatus
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All statuses</option>
                <option value="requested">Requested</option>
                <option value="assigned">Assigned</option>
                <option value="accepted">Accepted</option>
                <option value="on_the_way">On the way</option>
                <option value="in_progress">In progress</option>
                <option value="quotation_pending">Quote pending</option>
                <option value="quotation_approved">
                  Quote approved
                </option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="w-full lg:w-56">
              <label
                htmlFor="service-filter"
                className="text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Service
              </label>

              <select
                id="service-filter"
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All services</option>

                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div className="mt-6 grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="h-5 w-48 rounded bg-slate-200" />
                <div className="mt-4 h-4 w-72 rounded bg-slate-100" />
                <div className="mt-3 h-4 w-56 rounded bg-slate-100" />
                <div className="mt-6 h-12 w-full rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && filteredBookings.length === 0 && (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              ✓
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              No bookings found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Try changing your filters or search terms.
            </p>

            {(statusFilter !== "all" ||
              serviceFilter !== "all" ||
              search) && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Booking list */}
        {!loading && filteredBookings.length > 0 && (
          <section className="mt-6 space-y-4">
            {filteredBookings.map((booking) => {
              const serviceName =
                serviceMap.get(booking.service_id) ?? "Service";

              const assignedKarigar = booking.karigar_id
                ? karigarMap.get(booking.karigar_id)
                : null;

              const matchingKarigars = getMatchingKarigars(
                booking.service_id
              );

              const isRequested = booking.status === "requested";

              return (
                <article
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300"
                >
                  {/* Card top */}
                  <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">
                          {getServiceInitial(serviceName)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-950">
                              {serviceName}
                            </h2>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${getStatusClasses(
                                booking.status
                              )}`}
                            >
                              {statusLabels[booking.status]}
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Booking #{booking.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>

                      <div className="text-left lg:text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Requested time
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(booking.preferred_time)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Main details */}
                  <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
                    <div className="border-b border-slate-100 p-5 sm:p-6 lg:border-b-0 lg:border-r">
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Customer
                          </p>

                          <p className="mt-1 font-bold text-slate-900">
                            {booking.customer_name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {booking.customer_phone}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Problem
                          </p>

                          <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                            {booking.problem}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                            Service address
                          </p>

                          <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                            {booking.address}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                        Assigned Karigar
                      </p>

                      {assignedKarigar ? (
                        <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-slate-900">
                                {assignedKarigar.name}
                              </p>

                              <p className="mt-1 text-sm text-slate-600">
                                ⭐ {assignedKarigar.rating} ·{" "}
                                {assignedKarigar.experience} years experience
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                {assignedKarigar.phone}
                              </p>
                            </div>

                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                              Verified
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="font-semibold text-amber-900">
                            Not assigned yet
                          </p>

                          <p className="mt-1 text-sm leading-5 text-amber-700">
                            Assign a verified Karigar who matches this
                            service.
                          </p>
                        </div>
                      )}

                      {/* Assignment */}
                      {isRequested && !assignedKarigar && (
                        <div className="mt-4">
                          <label
                            htmlFor={`karigar-${booking.id}`}
                            className="text-xs font-bold uppercase tracking-wide text-slate-500"
                          >
                            Assign verified Karigar
                          </label>

                          {matchingKarigars.length > 0 ? (
                            <>
                              <select
                                id={`karigar-${booking.id}`}
                                value={selectedKarigar[booking.id] ?? ""}
                                onChange={(event) =>
                                  setSelectedKarigar((current) => ({
                                    ...current,
                                    [booking.id]: event.target.value,
                                  }))
                                }
                                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="">
                                  Select a Karigar
                                </option>

                                {matchingKarigars.map((karigar) => (
                                  <option
                                    key={karigar.id}
                                    value={karigar.id}
                                  >
                                    {karigar.name} — ⭐ {karigar.rating} —{" "}
                                    {karigar.area}
                                  </option>
                                ))}
                              </select>

                              <button
                                type="button"
                                onClick={() => assignKarigar(booking)}
                                disabled={
                                  assigningBookingId === booking.id ||
                                  !selectedKarigar[booking.id]
                                }
                                className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {assigningBookingId === booking.id
                                  ? "Assigning..."
                                  : "Assign Karigar"}
                              </button>
                            </>
                          ) : (
                            <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-3">
                              <p className="text-sm font-medium text-red-700">
                                No verified Karigar is available for this
                                service.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {(booking.status === "requested" ||
                    booking.status === "assigned") && (
                    <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs text-slate-500">
                          Created{" "}
                          {booking.created_at
                            ? formatDate(booking.created_at)
                            : "recently"}
                        </p>

                        <button
                          type="button"
                          onClick={() => void cancelBooking(booking)}
                          disabled={cancellingBookingId === booking.id}
                          className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {cancellingBookingId === booking.id
                            ? "Cancelling..."
                            : "Cancel Booking"}
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}