import Link from "next/link";
import {
  ArrowLeft,
  Home,
  RefreshCw,
  ShoppingCart,
  Sparkles,
  XCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function CheckoutCancelledPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40 md:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-red-400/20 bg-red-400/10">
            <XCircle className="h-12 w-12 text-red-300" />
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-yellow-200">
              <Sparkles className="h-4 w-4" />
              Checkout Cancelled
            </div>

            <h1 className="mt-6 text-4xl font-black md:text-6xl">
              No Payment Was Taken
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
              Your checkout session was cancelled before payment was completed.
              You can return to the storefront, try again, or go back to your
              dashboard.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <ShoppingCart className="h-8 w-8 text-yellow-300" />

              <h2 className="mt-5 text-xl font-black">Cart Saved</h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                The customer can restart checkout when they are ready.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <RefreshCw className="h-8 w-8 text-yellow-300" />

              <h2 className="mt-5 text-xl font-black">Try Again</h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                If this was a mistake, the checkout button can be clicked again.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <Sparkles className="h-8 w-8 text-yellow-300" />

              <h2 className="mt-5 text-xl font-black">No Charge</h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Since the payment was not completed, no charge was processed.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 font-black text-black transition hover:bg-yellow-300"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 font-bold text-white transition hover:border-yellow-400/30"
            >
              <Home className="h-5 w-5" />
              Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}