"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentProfile, logout } from "@/lib/auth";

type Profile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: "customer" | "karigar" | "admin";
};

export default function AccountPage() {
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      const currentProfile = await getCurrentProfile();

      if (!currentProfile) {
        router.replace("/auth");
        return;
      }

      setProfile(currentProfile);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleLogout() {
    await logout();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading account...</p>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const destination =
    profile.role === "admin"
      ? "/admin"
      : profile.role === "karigar"
        ? "/karigar"
        : "/customer/services";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
          MyKarigar
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          My Account
        </h1>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm text-slate-500">Name</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {profile.name}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm text-slate-500">Phone</p>
            <p className="mt-1 font-medium text-slate-900">
              {profile.phone}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm text-slate-500">Email</p>
            <p className="mt-1 font-medium text-slate-900">
              {profile.email}
            </p>
          </div>

          <div className="mt-5">
            <p className="text-sm text-slate-500">Role</p>
            <span className="mt-1 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold capitalize text-blue-700">
              {profile.role}
            </span>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => router.push(destination)}
              className="rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Open My Dashboard
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
