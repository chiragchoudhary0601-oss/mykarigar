"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          throw new Error("Please enter your name.");
        }

        if (!phone.trim()) {
          throw new Error("Please enter your phone number.");
        }

        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters.");
        }

        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (signupError) {
          throw signupError;
        }

        if (!data.user) {
          throw new Error("Account could not be created.");
        }

        // Create the MyKarigar profile for the authenticated user.
        const { error: profileError } = await supabase.from("users").insert({
          id: data.user.id,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          role: "customer",
        });

        if (profileError) {
          console.error("PROFILE CREATE ERROR:", profileError);

          // If the profile already exists, don't block the user.
          if (!profileError.message.toLowerCase().includes("duplicate")) {
            throw new Error(
              "Account was created, but your MyKarigar profile could not be created."
            );
          }
        }

        if (data.session) {
          setMessage("Account created successfully. Redirecting...");
         router.push("/customer/services");
          router.refresh();
        } else {
          setMessage(
            "Account created! Please check your email and verify your account before logging in."
          );
        }

        return;
      }

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.user) {
        throw new Error("Login failed. Please try again.");
      }

      setMessage("Login successful. Redirecting...");

      router.push("/customer");
      router.refresh();
    } catch (err) {
      console.error("AUTH ERROR:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setMessage("");
    setError("");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-md items-center px-5 py-10">
        <div className="w-full">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              MyKarigar
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              {mode === "login"
                ? "Login to manage your MyKarigar services."
                : "Create your MyKarigar customer account."}
            </p>
          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => switchMode("login")}
                className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`rounded-md px-4 py-2.5 text-sm font-semibold transition ${
                  mode === "signup"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <>
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Full name
                    </label>

                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      required
                      placeholder="Enter your name"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-slate-700"
                    >
                      Phone number
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      required
                      placeholder="Enter your phone number"
                      className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="Minimum 6 characters"
                  className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login"
                    : "Create Account"}
              </button>

              {message && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                  {message}
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            By continuing, you agree to use MyKarigar responsibly.
          </p>
        </div>
      </div>
    </main>
  );
}
