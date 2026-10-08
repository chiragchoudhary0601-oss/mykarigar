"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

   const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

        const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) {
      console.error("PROFILE LOOKUP ERROR:", profileError);
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (profile?.role === "admin") {
      router.push("/admin");
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
            Welcome back
          </h1>

          <p className="mt-2 text-slate-600">
            Login to manage your service bookings.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signup"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Don&apos;t have an account? Create one
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
