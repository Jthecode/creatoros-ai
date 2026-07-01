"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  PackageCheck,
  RefreshCw,
  Search,
  ShoppingBag,
  XCircle,
} from "lucide-react";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled";

type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "fulfilled"
  | "shipped"
  | "cancelled";

type Order = {
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

type Props = {
  businessId: string;
  initialOrders: Order[];
};

const paymentStatuses: PaymentStatus[] = [
  "pending",
  "paid",
  "failed",
  "refunded",
  "cancelled",
];

const fulfillmentStatuses: FulfillmentStatus[] = [
  "unfulfilled",
  "processing",
  "fulfilled",
  "shipped",
  "cancelled",
];

function getTotalCents(order: Order) {
  if (typeof order.total_cents === "number") return order.total_cents;
  return Math.round(Number(order.total ?? 0) * 100);
}

function formatCurrency(order: Order) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: order.currency || "USD",
    maximumFractionDigits: 0,
  }).format(getTotalCents(order) / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getPaymentClass(status: string | null) {
  if (status === "paid" || status === "completed" || status === "succeeded") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "failed" || status === "refunded" || status === "cancelled") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
}

function getPaymentIcon(status: string | null) {
  if (status === "paid" || status === "completed" || status === "succeeded") {
    return CheckCircle2;
  }

  if (status === "failed" || status === "refunded" || status === "cancelled") {
    return XCircle;
  }

  return Clock;
}

export default function OrdersClient({ businessId, initialOrders }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [query, setQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const search = query.toLowerCase();

      const matchesSearch =
        (order.customer_email ?? "").toLowerCase().includes(search) ||
        (order.product_name ?? "").toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search);

      const matchesPayment =
        paymentFilter === "all"
          ? true
          : (order.payment_status || order.status) === paymentFilter;

      const matchesFulfillment =
        fulfillmentFilter === "all"
          ? true
          : order.fulfillment_status === fulfillmentFilter;

      return matchesSearch && matchesPayment && matchesFulfillment;
    });
  }, [orders, query, paymentFilter, fulfillmentFilter]);

  async function updateOrder(
    order: Order,
    updates: Partial<{
      payment_status: PaymentStatus;
      fulfillment_status: FulfillmentStatus;
      status: PaymentStatus;
    }>
  ) {
    try {
      setBusyId(order.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: order.id,
          businessId,
          ...updates,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update order.");
      }

      setOrders((current) =>
        current.map((item) =>
          item.id === order.id ? (data.order as Order) : item
        )
      );

      setSuccess("Order updated.");
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update order."
      );
    } finally {
      setBusyId("");
    }
  }

  async function refreshOrders() {
    try {
      setBusyId("refresh");
      setError("");
      setSuccess("");

      const res = await fetch(`/api/orders?businessId=${businessId}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to refresh orders.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
      setSuccess("Orders refreshed.");
    } catch (refreshError) {
      console.error(refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh orders."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Manage Orders</h2>
            <p className="text-sm text-zinc-500">
              Search, update payment status, and update fulfillment status.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshOrders}
            disabled={busyId === "refresh"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyId === "refresh" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search orders..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            <option value="all">All Payments</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={fulfillmentFilter}
            onChange={(event) => setFulfillmentFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            <option value="all">All Fulfillment</option>
            {fulfillmentStatuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        {filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-black">No orders found</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredOrders.map((order) => {
              const paymentStatus = order.payment_status || order.status || "pending";
              const PaymentIcon = getPaymentIcon(paymentStatus);
              const isBusy = busyId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-3xl border border-white/10 bg-black/40 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-black">
                          {order.customer_email || "Unknown customer"}
                        </h3>

                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold capitalize ${getPaymentClass(
                            paymentStatus
                          )}`}
                        >
                          <PaymentIcon className="h-3.5 w-3.5" />
                          {paymentStatus}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-300">
                          {order.fulfillment_status || "unfulfilled"}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-zinc-500">
                        Order #{order.id.slice(0, 8)} ·{" "}
                        {formatDate(order.created_at)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
                        <span className="inline-flex items-center gap-2">
                          <PackageCheck className="h-4 w-4 text-yellow-200" />
                          {order.product_name || "CreatorOS Product"}
                        </span>

                        {order.customer_email ? (
                          <a
                            href={`mailto:${order.customer_email}`}
                            className="inline-flex items-center gap-2 hover:text-yellow-200"
                          >
                            <Mail className="h-4 w-4" />
                            Email customer
                          </a>
                        ) : null}
                      </div>
                    </div>

                    <p className="text-2xl font-black text-yellow-300">
                      {formatCurrency(order)}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-xs font-bold text-zinc-500">
                        Payment Status
                      </span>

                      <select
                        value={paymentStatus}
                        onChange={(event) =>
                          updateOrder(order, {
                            payment_status: event.target.value as PaymentStatus,
                            status: event.target.value as PaymentStatus,
                          })
                        }
                        disabled={isBusy}
                        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-zinc-300 outline-none disabled:opacity-60"
                      >
                        {paymentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="space-y-2">
                      <span className="text-xs font-bold text-zinc-500">
                        Fulfillment Status
                      </span>

                      <select
                        value={order.fulfillment_status || "unfulfilled"}
                        onChange={(event) =>
                          updateOrder(order, {
                            fulfillment_status:
                              event.target.value as FulfillmentStatus,
                          })
                        }
                        disabled={isBusy}
                        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-zinc-300 outline-none disabled:opacity-60"
                      >
                        {fulfillmentStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {isBusy ? (
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-yellow-200">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating order...
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}