import Link from "next/link";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              MyKarigar Admin
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage your marketplace
            </p>
          </div>

          <Link
            href="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Website
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Admin Dashboard
          </h2>

          <p className="mt-2 text-slate-600">
            Manage bookings, services, customers and Karigars.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/admin/bookings"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="text-3xl">📋</div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Bookings
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View and manage customer bookings.
            </p>
          </Link>

          <Link
            href="/admin/services"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="text-3xl">🛠️</div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Services
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add, edit and manage services.
            </p>
          </Link>

          <Link
            href="/admin/karigars"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="text-3xl">👨‍🔧</div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Karigars
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage your service professionals.
            </p>
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"
          >
            <div className="text-3xl">👥</div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Customers
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              View registered customers.
            </p>
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="text-lg font-bold text-slate-900">
            MyKarigar Marketplace
          </h3>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Use the admin panel to manage bookings, assign Karigars, control
            services and manage your local services marketplace.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/bookings"
              className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Manage Bookings
            </Link>

            <Link
              href="/karigar"
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open Karigar Dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}