import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  Package,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: Props) {
  const { session_id } = await searchParams;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.03] p-8 shadow-2xl shadow-black/40 md:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10">
            <CheckCircle2 className="h-12 w-12 text-emerald-300" />
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-yellow-200">
              <Sparkles className="h-4 w-4" />
              Payment Successful
            </div>

            <h1 className="mt-6 text-4xl font-black md:text-6xl">
              Thank You!
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
              Your payment has been processed successfully. Your order has been
              received and CreatorOS AI is now preparing everything for you.
            </p>

            {session_id ? (
              <div className="mx-auto mt-8 max-w-xl rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Stripe Session
                </p>

                <p className="mt-3 break-all font-mono text-sm text-yellow-300">
                  {session_id}
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <ShoppingBag className="h-8 w-8 text-yellow-300" />

              <h2 className="mt-5 text-xl font-black">
                Order Received
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Your purchase has been securely received and recorded.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <Package className="h-8 w-8 text-yellow-300" />

              <h2 className="mt-5 text-xl font-black">
                Processing
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Digital products will be prepared automatically. Physical
                products can begin fulfillment immediately.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <Sparkles className="h-8 w-8 text-yellow-300" />

              <h2 className="mt-5 text-xl font-black">
                Analytics Updated
              </h2>

              <p className="mt-3 text-sm leading-6 text-zinc-400">
                Revenue, conversions, and sales analytics will update after the
                Stripe webhook completes.
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-8 py-4 font-black text-black transition hover:bg-yellow-300"
            >
              Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-4 font-bold text-white transition hover:border-yellow-400/30"
            >
              <Home className="h-5 w-5" />
              Back Home
            </Link>
          </div>

          <div className="mt-12 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <h3 className="text-lg font-black text-yellow-100">
              Whats Next?
            </h3>

            <ul className="mt-4 space-y-3 text-sm leading-7 text-yellow-100/80">
              <li>• Your Stripe webhook will confirm the payment.</li>
              <li>• Your order will automatically update to Paid.</li>
              <li>• Revenue analytics will refresh.</li>
              <li>• Customer records will be updated.</li>
              <li>• CreatorOS AI will use this purchase to improve business insights.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}