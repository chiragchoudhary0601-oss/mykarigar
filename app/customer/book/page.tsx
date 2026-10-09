"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Service = {
  id: string;
  name: string;
  description: string | null;
  base_price: number | null;
};

export default function BookingPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [loadingServices, setLoadingServices] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadServices() {
      setLoadingServices(true);
      setError("");

      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, base_price")
        .eq("active", true)
        .order("name");

      if (error) {
        console.error("LOAD SERVICES ERROR:", error);
        setError("Could not load available services. Please try again.");
        setServices([]);
        setLoadingServices(false);
        return;
      }

      setServices(data ?? []);

      if (data && data.length > 0) {
        setSelectedServiceId(data[0].id);
      }

      setLoadingServices(false);
    }

    loadServices();
  }, []);

  const selectedService = services.find(
    (service) => service.id === selectedServiceId
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");
    setSubmitted(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("name") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const problem = String(formData.get("problem") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const preferredTime = String(
      formData.get("preferred_time") || ""
    ).trim();

    if (!selectedServiceId) {
      setError("Please select a service.");
      setLoading(false);
      return;
    }

    if (name.length < 2) {
      setError("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    if (problem.length < 5) {
      setError("Please describe the problem in a little more detail.");
      setLoading(false);
      return;
    }

    if (address.length < 10) {
      setError("Please enter your complete service address.");
      setLoading(false);
      return;
    }

    if (!preferredTime) {
      setError("Please select your preferred service time.");
      setLoading(false);
      return;
    }

    try {
  // Get the currently logged-in Supabase user.
const {
  data: { user },
  error: userError,
} = await supabase.auth.getUser();

if (userError) {
  console.error("GET USER ERROR:", userError);
  throw userError;
}

// User must be logged in before creating a booking.
if (!user) {
  router.push("/login");
  return;
}

// Check that the authenticated user has a customer profile.
const { data: profile, error: profileError } = await supabase
  .from("users")
  .select("id")
  .eq("id", user.id)
  .maybeSingle();

if (profileError) {
  console.error("CUSTOMER PROFILE ERROR:", profileError);
  throw profileError;
}

if (!profile) {
  setError(
    "Your customer profile is missing. Please log out and sign up again, or contact support."
  );
  return;
}

// Create booking belonging to the authenticated customer.
const { error: bookingError } = await supabase
  .from("bookings")
  .insert({
    customer_id: profile.id,
    service_id: selectedServiceId,
    customer_name: name,
    customer_phone: phone,
    problem,
    address,
    preferred_time: preferredTime,
    status: "requested",
  });

if (bookingError) {
  console.error("BOOKING INSERT ERROR:", bookingError);
  throw bookingError;
}

      setSubmitted(true);

      setMessage(
        "Your booking request has been submitted successfully."
      );

      form.reset();

      if (services.length > 0) {
        setSelectedServiceId(services[0].id);
      }
    } catch (err) {
  console.error("BOOKING ERROR:", err);

  if (err && typeof err === "object" && "message" in err) {
    const bookingMessage = String(err.message);
    setError(`Booking failed: ${bookingMessage}`);
  } else {
    setError(`Booking failed: ${String(err)}`);
  }
} finally {
  setLoading(false);
}
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto flex min-h-screen max-w-2xl items-center px-6 py-12">
          <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <span className="text-3xl text-green-600">✓</span>
            </div>

            <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-blue-600">
              MyKarigar
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              Booking request received
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-slate-600">
              {selectedService
                ? `Your ${selectedService.name.toLowerCase()} request has been received.`
                : "Your service request has been received."}
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-left">
              <p className="font-semibold text-slate-900">
                What happens next?
              </p>

              <div className="mt-4 space-y-3 text-sm text-slate-600">
                <div className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <span>Our team reviews your request.</span>
                </div>

                <div className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <span>
                    A verified Karigar is assigned to your booking.
                  </span>
                </div>

                <div className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <span>
                    You can track the job and approve the quote.
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/customer/bookings"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
              >
                View My Bookings
              </Link>

              <Link
                href="/customer/services"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Back to Services
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-6">
          <Link
            href="/customer/services"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            ← Back to services
          </Link>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            MyKarigar
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Book a Service
          </h1>

          <p className="mt-2 max-w-2xl text-slate-600">
            Tell us what you need help with. We&apos;ll connect you with a
            verified local Karigar.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
              ✓
            </div>

            <div>
              <p className="font-semibold text-blue-900">
                Safe and simple booking
              </p>

              <p className="mt-1 text-sm text-blue-800">
                Submit your request and our team will assign a Karigar to
                help you.
              </p>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
        >
          <div className="space-y-6">
            <div>
              <label
                htmlFor="service"
                className="block text-sm font-semibold text-slate-800"
              >
                What service do you need?
              </label>

              {loadingServices ? (
                <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Loading available services...
                </div>
              ) : services.length === 0 ? (
                <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  No services are currently available.
                </div>
              ) : (
                <select
                  id="service"
                  value={selectedServiceId}
                  onChange={(event) =>
                    setSelectedServiceId(event.target.value)
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                      {service.base_price !== null
                        ? ` — starting ₹${service.base_price}`
                        : ""}
                    </option>
                  ))}
                </select>
              )}

              {selectedService?.description && (
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {selectedService.description}
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-900">
                Your details
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                We&apos;ll use these details to contact you about the booking.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    minLength={2}
                    autoComplete="name"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Rahul Kumar"
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Phone number
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    pattern="[0-9]{10}"
                    autoComplete="tel"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="10-digit mobile number"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-bold text-slate-900">
                Service details
              </h2>

              <div className="mt-5 space-y-5">
                <div>
                  <label
                    htmlFor="problem"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    What needs to be fixed?
                  </label>

                  <textarea
                    id="problem"
                    name="problem"
                    required
                    minLength={5}
                    rows={4}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="Example: Ceiling fan is not working and making a noise."
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    Give us a short description so the Karigar knows what to
                    expect.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Service address
                  </label>

                  <textarea
                    id="address"
                    name="address"
                    required
                    minLength={10}
                    rows={3}
                    autoComplete="street-address"
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    placeholder="House/flat number, street, area, city"
                  />
                </div>

                <div>
                  <label
                    htmlFor="preferred_time"
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Preferred service time
                  </label>

                  <input
                    id="preferred_time"
                    name="preferred_time"
                    type="datetime-local"
                    required
                    className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    We&apos;ll try our best to match your preferred time.
                  </p>
                </div>
              </div>
            </div>

            {message && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
                {message}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <div className="border-t border-slate-100 pt-6">
              <button
                type="submit"
                disabled={
                  loading ||
                  loadingServices ||
                  services.length === 0
                }
                className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-base font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Submitting booking..."
                  : selectedService
                    ? `Request ${selectedService.name}`
                    : "Request Service"}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">
                No payment is required to submit this request.
              </p>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}