import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  CreditCard,
  DollarSign,
  FileText,
  Receipt,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
};

type OrderRow = {
  id: string;
  total_cents: number | null;
  status: string | null;
  customer_email: string | null;
};

async function loadFinance(id: string) {
  const [businessResult, ordersResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("orders")
      .select("id, total_cents, status, customer_email")
      .eq("business_id", id),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (ordersResult.error) throw ordersResult.error;

  return {
    business: businessResult.data as BusinessRow,
    orders: (ordersResult.data ?? []) as OrderRow[],
  };
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function FinancePage({ params }: Props) {
  const { id } = await params;
  const data = await loadFinance(id);

  if (!data) {
    notFound();
  }

  const { business, orders } = data;

  const paidOrders = orders.filter((order) => order.status === "paid");

  const grossRevenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_cents ?? 0),
    0
  );

  const estimatedPlatformFees = Math.round(grossRevenue * 0.05);
  const estimatedNetRevenue = grossRevenue - estimatedPlatformFees;

  const financeCards = [
    {
      label: "Gross Revenue",
      value: formatCurrency(grossRevenue),
      icon: DollarSign,
    },
    {
      label: "Estimated Net",
      value: formatCurrency(estimatedNetRevenue),
      icon: Wallet,
    },
    {
      label: "Platform Fees",
      value: formatCurrency(estimatedPlatformFees),
      icon: CreditCard,
    },
    {
      label: "Paid Orders",
      value: paidOrders.length.toString(),
      icon: Receipt,
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="mb-8 inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
        >
          <ArrowLeft size={18} />
          Back to Business
        </Link>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">
            AI Finance Center
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Finance for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Track revenue, orders, estimated fees, net income, invoices,
            payouts, subscriptions, tax reports, and AI financial insights.
          </p>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {financeCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                  <Icon size={22} />
                </div>

                <p className="text-sm text-zinc-400">{card.label}</p>

                <h2 className="mt-2 text-3xl font-bold">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <TrendingUp className="text-yellow-400" />
              <h2 className="text-2xl font-bold">Revenue Breakdown</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-zinc-400">Gross Revenue</span>
                <span className="font-bold text-white">
                  {formatCurrency(grossRevenue)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-zinc-400">Estimated Platform Fees</span>
                <span className="font-bold text-yellow-400">
                  {formatCurrency(estimatedPlatformFees)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-zinc-400">Estimated Net Revenue</span>
                <span className="font-bold text-green-300">
                  {formatCurrency(estimatedNetRevenue)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <div className="mb-5 flex items-center gap-3">
              <Banknote className="text-yellow-400" />
              <h2 className="text-2xl font-bold">AI Finance Assistant</h2>
            </div>

            <p className="text-sm leading-7 text-zinc-300">
              CreatorOS AI will help summarize revenue, detect strong products,
              estimate fees, prepare financial reports, and recommend ways to
              increase profit.
            </p>

            <button className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300">
              Generate Finance Report
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-5 flex items-center gap-3">
            <FileText className="text-yellow-400" />
            <h2 className="text-2xl font-bold">Recent Transactions</h2>
          </div>

          {orders.length === 0 ? (
            <p className="text-sm leading-6 text-zinc-400">
              No transactions yet. Paid Stripe orders will appear here once
              checkout and webhook saving are connected.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 10).map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-bold">
                      {order.customer_email || "Unknown customer"}
                    </h3>

                    <p className="mt-1 text-sm capitalize text-zinc-500">
                      {order.status || "pending"}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-yellow-400">
                    {formatCurrency(Number(order.total_cents ?? 0))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}