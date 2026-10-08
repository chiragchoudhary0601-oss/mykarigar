import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-blue-600">
            MyKarigar
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Trusted local professionals,
            <span className="block text-blue-600">
              when you need them.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Book verified local service professionals with transparent
            pricing and reliable service.
          </p>

          <div className="mt-8">
            <Link
              href="/customer/services"
              className="inline-flex rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
            >
              Book a Service
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}