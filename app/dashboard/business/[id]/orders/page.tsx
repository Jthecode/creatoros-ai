import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  Receipt,
  Search,
  ShoppingBag,
  User,
  XCircle,
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
  slug: string;
};

type OrderRow = {
  id: string;
  business_id: string;
  customer_email: string | null;
  total_cents: number | null;
  currency: string | null;
  status: string | null;
  created_at: string;
};

function formatCurrency(cents: number | null, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusStyles(status: string | null) {
  if (status === "paid") {
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "refunded" || status === "cancelled") {
    return "border-red-500/20 bg-red-500/10 text-red-300";
  }

  return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
}

function getStatusIcon(status: string | null) {
  if (status === "paid") return CheckCircle2;
  if (status === "refunded" || status === "cancelled") return XCircle;
  return Clock;
}

async function loadOrders(id: string) {
  const [businessResult, ordersResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("orders")
      .select("id, business_id, customer_email, total_cents, currency, status, created_at")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (ordersResult.error) {
    throw ordersResult.error;
  }

  return {
    business: businessResult.data as BusinessRow,
    orders: (ordersResult.data ?? []) as OrderRow[],
  };
}

export default async function OrdersPage({ params }: Props) {
  const { id } = await params;
  const data = await loadOrders(id);

  if (!data) {
    notFound();
  }

  const { business, orders } = data;

  const paidOrders = orders.filter((order) => order.status === "paid");
  const pendingOrders = orders.filter((order) => order.status !== "paid");

  const grossRevenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_cents ?? 0),
    0
  );

  const averageOrderValue =
    paidOrders.length > 0 ? Math.round(grossRevenue / paidOrders.length) : 0;

  const uniqueCustomers = new Set(
    orders.map((order) => order.customer_email).filter(Boolean)
  );

  const statCards = [
    {
      label: "Gross Revenue",
      value: formatCurrency(grossRevenue),
      icon: DollarSign,
    },
    {
      label: "Total Orders",
      value: orders.length.toString(),
      icon: ShoppingBag,
    },
    {
      label: "Paid Orders",
      value: paidOrders.length.toString(),
      icon: CheckCircle2,
    },
    {
      label: "Average Order",
      value: formatCurrency(averageOrderValue),
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
            Orders Dashboard
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Orders for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Track Stripe purchases, customer emails, payment status, revenue,
            and order activity for this CreatorOS AI business.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/storefront/${business.slug}`}
              className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
            >
              View Storefront
            </Link>

            <Link
              href={`/dashboard/business/${business.id}/finance`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50"
            >
              Finance Center
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
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

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <User className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Customers</p>
            <h2 className="mt-2 text-3xl font-bold">
              {uniqueCustomers.size}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Clock className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Pending / Other</p>
            <h2 className="mt-2 text-3xl font-bold">
              {pendingOrders.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Receipt className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Order System</p>
            <h2 className="mt-2 text-3xl font-bold">Live</h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Recent Orders</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Orders are created automatically when Stripe checkout is
                completed.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-zinc-500">
              <Search size={18} />
              <span className="text-sm">Search coming soon...</span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-10 text-center">
              <ShoppingBag size={56} className="mx-auto text-yellow-400" />

              <h3 className="mt-5 text-2xl font-bold">No orders yet</h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Once customers buy from your storefront, completed Stripe
                payments will appear here automatically.
              </p>

              <Link
                href={`/storefront/${business.slug}`}
                className="mt-6 inline-flex rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
              >
                Preview Storefront
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="hidden grid-cols-5 border-b border-white/10 bg-black/60 px-5 py-4 text-sm font-semibold text-zinc-400 md:grid">
                <span>Customer</span>
                <span>Status</span>
                <span>Amount</span>
                <span>Date</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-white/10">
                {orders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status);

                  return (
                    <div
                      key={order.id}
                      className="grid gap-4 bg-black/30 p-5 md:grid-cols-5 md:items-center"
                    >
                      <div>
                        <p className="font-bold">
                          {order.customer_email || "Unknown customer"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Order #{order.id.slice(0, 8)}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyles(
                            order.status
                          )}`}
                        >
                          <StatusIcon size={14} />
                          {order.status || "pending"}
                        </span>
                      </div>

                      <p className="text-lg font-bold text-yellow-400">
                        {formatCurrency(
                          order.total_cents,
                          order.currency ?? "USD"
                        )}
                      </p>

                      <p className="text-sm text-zinc-400">
                        {formatDate(order.created_at)}
                      </p>

                      <div className="flex justify-start gap-2 md:justify-end">
                        {order.customer_email && (
                          <a
                            href={`mailto:${order.customer_email}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
                          >
                            <Mail size={15} />
                            Email
                          </a>
                        )}

                        <Link
                          href={`/dashboard/business/${business.id}/crm`}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
                        >
                          CRM
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}