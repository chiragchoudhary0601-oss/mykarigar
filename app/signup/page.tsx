"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: signupError,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      setError("Unable to create account.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase.from("users").insert({
      id: user.id,
      name: name.trim(),
      phone,
      email,
      role: "customer",
    });

    if (profileError) {
      console.error(profileError);

      setError(
        `Account created, but profile setup failed: ${profileError.message}`
      );

      setLoading(false);
      return;
    }

    router.push("/customer/services");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-6 py-10">
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
            MyKarigar
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Create account
          </h1>

          <p className="mt-2 text-slate-600">
            Create your customer account to book services.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Full name
              </label>

              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Phone number
              </label>

              <input
                type="tel"
                required
                maxLength={10}
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/\D/g, ""))
                }
                placeholder="9876543210"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                Password
              </label>

              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
