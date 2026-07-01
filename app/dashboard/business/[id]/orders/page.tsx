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
  slug: string | null;
};

type OrderRow = {
  id: string;
  business_id: string;
  customer_email: string | null;
  product_name?: string | null;
  quantity?: number | null;
  total: number;
  total_cents?: number | null;
  currency: string | null;
  payment_status: string | null;
  fulfillment_status: string | null;
  status: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

function normalizeOrder(order: Record<string, unknown>): OrderRow {
  const totalCents =
    typeof order.total_cents === "number"
      ? order.total_cents
      : typeof order.total === "number"
        ? Math.round(order.total * 100)
        : 0;

  const paymentStatus =
    typeof order.payment_status === "string"
      ? order.payment_status
      : typeof order.status === "string"
        ? order.status
        : "pending";

  return {
    id: String(order.id),
    business_id: String(order.business_id),
    customer_email:
      typeof order.customer_email === "string" ? order.customer_email : null,
    product_name:
      typeof order.product_name === "string" ? order.product_name : null,
    quantity: typeof order.quantity === "number" ? order.quantity : null,
    total: typeof order.total === "number" ? order.total : totalCents / 100,
    total_cents: totalCents,
    currency: typeof order.currency === "string" ? order.currency : "USD",
    payment_status: paymentStatus,
    fulfillment_status:
      typeof order.fulfillment_status === "string"
        ? order.fulfillment_status
        : "unfulfilled",
    status: paymentStatus,
    metadata:
      typeof order.metadata === "object" && order.metadata !== null
        ? (order.metadata as Record<string, unknown>)
        : null,
    created_at:
      typeof order.created_at === "string"
        ? order.created_at
        : new Date().toISOString(),
  };
}

function formatCurrency(cents: number | null | undefined, currency = "USD") {
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
  if (status === "paid" || status === "completed" || status === "succeeded") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "refunded" || status === "cancelled" || status === "failed") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
}

function getStatusIcon(status: string | null) {
  if (status === "paid" || status === "completed" || status === "succeeded") {
    return CheckCircle2;
  }

  if (status === "refunded" || status === "cancelled" || status === "failed") {
    return XCircle;
  }

  return Clock;
}

function isPaidOrder(order: OrderRow) {
  const status = order.payment_status || order.status;

  return status === "paid" || status === "completed" || status === "succeeded";
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
      .select("*")
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
    orders: ((ordersResult.data ?? []) as Record<string, unknown>[]).map(
      normalizeOrder
    ),
  };
}

export default async function OrdersPage({ params }: Props) {
  const { id } = await params;
  const data = await loadOrders(id);

  if (!data) {
    notFound();
  }

  const { business, orders } = data;

  const paidOrders = orders.filter(isPaidOrder);

  const pendingOrders = orders.filter((order) => {
    const status = order.payment_status || order.status;
    return status === "pending" || status === "open" || status === "unpaid";
  });

  const failedOrders = orders.filter((order) => {
    const status = order.payment_status || order.status;
    return status === "failed" || status === "cancelled" || status === "refunded";
  });

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
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Receipt className="h-3.5 w-3.5" />
                  Orders Dashboard
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Orders for {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Track Stripe purchases, customer emails, payment status,
                  fulfillment status, revenue, and order activity.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {business.slug ? (
                  <Link
                    href={`/storefront/${business.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                  >
                    View Storefront
                    <ShoppingBag className="h-4 w-4" />
                  </Link>
                ) : null}

                <Link
                  href={`/dashboard/business/${business.id}/finance`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  Finance Center
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="text-xs text-zinc-500">{card.label}</p>
                <h2 className="mt-2 text-3xl font-black">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <User className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Customers</p>
            <h2 className="mt-2 text-3xl font-black">
              {uniqueCustomers.size}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Clock className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Pending Orders</p>
            <h2 className="mt-2 text-3xl font-black">
              {pendingOrders.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <XCircle className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Failed / Refunded</p>
            <h2 className="mt-2 text-3xl font-black">{failedOrders.length}</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">Recent Orders</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Orders are created automatically when Stripe checkout is
                completed.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-zinc-500">
              <Search className="h-4 w-4" />
              <span className="text-sm">
                Step 4 adds search and status controls
              </span>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/40 p-10 text-center">
              <ShoppingBag className="mx-auto h-14 w-14 text-yellow-200" />

              <h3 className="mt-5 text-2xl font-black">No orders yet</h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Once customers buy from your storefront, completed Stripe
                payments will appear here automatically.
              </p>

              {business.slug ? (
                <Link
                  href={`/storefront/${business.slug}`}
                  className="mt-6 inline-flex rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Preview Storefront
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="hidden grid-cols-6 border-b border-white/10 bg-black/60 px-5 py-4 text-sm font-bold text-zinc-400 lg:grid">
                <span>Customer</span>
                <span>Product</span>
                <span>Status</span>
                <span>Fulfillment</span>
                <span>Amount</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-white/10">
                {orders.map((order) => {
                  const status = order.payment_status || order.status;
                  const StatusIcon = getStatusIcon(status);

                  return (
                    <div
                      key={order.id}
                      className="grid gap-4 bg-black/30 p-5 lg:grid-cols-6 lg:items-center"
                    >
                      <div>
                        <p className="font-bold">
                          {order.customer_email || "Unknown customer"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Order #{order.id.slice(0, 8)} ·{" "}
                          {formatDate(order.created_at)}
                        </p>
                      </div>

                      <p className="text-sm text-zinc-300">
                        {order.product_name || "CreatorOS Product"}
                      </p>

                      <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusStyles(
                          status
                        )}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status || "pending"}
                      </span>

                      <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-300">
                        {order.fulfillment_status || "unfulfilled"}
                      </span>

                      <p className="text-lg font-black text-yellow-300">
                        {formatCurrency(
                          order.total_cents,
                          order.currency ?? "USD"
                        )}
                      </p>

                      <div className="flex justify-start gap-2 lg:justify-end">
                        {order.customer_email ? (
                          <a
                            href={`mailto:${order.customer_email}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-200"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                        ) : null}

                        <Link
                          href={`/dashboard/business/${business.id}/crm`}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-200"
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