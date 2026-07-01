"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  DollarSign,
  Eye,
  Loader2,
  MousePointerClick,
  Package,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

type AnalyticsEventRow = {
  id: string;
  business_id: string;
  event: string | null;
  page: string | null;
  source: string | null;
  product_id: string | null;
  order_id: string | null;
  lead_id: string | null;
  conversation_id: string | null;
  revenue: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type AnalyticsResponse = {
  success: boolean;
  totalEvents?: number;
  revenue?: number;
  eventCounts?: Record<string, number>;
  analytics?: AnalyticsEventRow[];
  error?: string;
};

type Props = {
  businessId: string;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatEventName(event: string) {
  return event.replaceAll("_", " ");
}

function getEventCount(
  eventCounts: Record<string, number>,
  eventName: string
) {
  return eventCounts[eventName] ?? 0;
}

export default function BusinessAnalyticsClient({ businessId }: Props) {
  const [analytics, setAnalytics] = useState<AnalyticsEventRow[]>([]);
  const [eventCounts, setEventCounts] = useState<Record<string, number>>({});
  const [revenue, setRevenue] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadAnalytics(options?: { refreshing?: boolean }) {
    try {
      if (options?.refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch(`/api/analytics/track?businessId=${businessId}`, {
        cache: "no-store",
      });

      const data = (await res.json().catch(() => null)) as
        | AnalyticsResponse
        | null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to load analytics.");
      }

      setAnalytics(Array.isArray(data.analytics) ? data.analytics : []);
      setEventCounts(data.eventCounts ?? {});
      setRevenue(Number(data.revenue ?? 0));
      setTotalEvents(Number(data.totalEvents ?? 0));
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load analytics."
      );
      setAnalytics([]);
      setEventCounts({});
      setRevenue(0);
      setTotalEvents(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/analytics/track?businessId=${businessId}`,
          {
            cache: "no-store",
          }
        );

        const data = (await res.json().catch(() => null)) as
          | AnalyticsResponse
          | null;

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Unable to load analytics.");
        }

        if (!cancelled) {
          setAnalytics(Array.isArray(data.analytics) ? data.analytics : []);
          setEventCounts(data.eventCounts ?? {});
          setRevenue(Number(data.revenue ?? 0));
          setTotalEvents(Number(data.totalEvents ?? 0));
        }
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load analytics."
          );
          setAnalytics([]);
          setEventCounts({});
          setRevenue(0);
          setTotalEvents(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (businessId) {
      void run();
    }

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const visitors = useMemo(() => {
    return (
      getEventCount(eventCounts, "storefront_view") +
      getEventCount(eventCounts, "page_view") +
      getEventCount(eventCounts, "dashboard_view")
    );
  }, [eventCounts]);

  const productViews = useMemo(() => {
    return getEventCount(eventCounts, "product_view");
  }, [eventCounts]);

  const checkoutStarts = useMemo(() => {
    return getEventCount(eventCounts, "checkout_started");
  }, [eventCounts]);

  const checkoutCompleted = useMemo(() => {
    return (
      getEventCount(eventCounts, "checkout_completed") +
      getEventCount(eventCounts, "product_purchase")
    );
  }, [eventCounts]);

  const leadCount = useMemo(() => {
    return getEventCount(eventCounts, "lead_created");
  }, [eventCounts]);

  const aiGenerations = useMemo(() => {
    return getEventCount(eventCounts, "ai_generation");
  }, [eventCounts]);

  const marketplaceInstalls = useMemo(() => {
    return getEventCount(eventCounts, "marketplace_install");
  }, [eventCounts]);

  const conversionRate = useMemo(() => {
    if (visitors <= 0) return 0;
    return Math.round((checkoutCompleted / visitors) * 100);
  }, [checkoutCompleted, visitors]);

  const topEvents = useMemo(() => {
    return Object.entries(eventCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [eventCounts]);

  const cards = [
    {
      label: "Revenue",
      value: formatCurrency(revenue),
      icon: DollarSign,
    },
    {
      label: "Visitors",
      value: visitors.toString(),
      icon: Eye,
    },
    {
      label: "Product Views",
      value: productViews.toString(),
      icon: Package,
    },
    {
      label: "Checkout Starts",
      value: checkoutStarts.toString(),
      icon: MousePointerClick,
    },
    {
      label: "Completed",
      value: checkoutCompleted.toString(),
      icon: ShoppingBag,
    },
    {
      label: "Conversion",
      value: `${conversionRate}%`,
      icon: TrendingUp,
    },
    {
      label: "Leads",
      value: leadCount.toString(),
      icon: Users,
    },
    {
      label: "AI Generations",
      value: aiGenerations.toString(),
      icon: Bot,
    },
    {
      label: "Marketplace Installs",
      value: marketplaceInstalls.toString(),
      icon: Sparkles,
    },
    {
      label: "Total Events",
      value: totalEvents.toString(),
      icon: Activity,
    },
  ];

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-yellow-200" />
        Loading analytics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-black">Live Analytics Feed</h2>
          <p className="text-sm text-zinc-500">
            Pulls directly from /api/analytics/track.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadAnalytics({ refreshing: true })}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.label}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                <Icon className="h-5 w-5" />
              </div>

              <p className="text-xs font-medium text-zinc-500">{card.label}</p>

              <h3 className="mt-2 text-2xl font-black">{card.value}</h3>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <BarChart3 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black">Top Events</h2>
              <p className="text-sm text-zinc-500">
                Most frequent tracked events.
              </p>
            </div>
          </div>

          {topEvents.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
              No events tracked yet.
            </p>
          ) : (
            <div className="space-y-3">
              {topEvents.map(([event, count]) => (
                <div
                  key={event}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <span className="text-sm font-bold capitalize">
                    {formatEventName(event)}
                  </span>

                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <Zap className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-black">Recent Events</h2>
              <p className="text-sm text-zinc-500">
                Latest activity for this business.
              </p>
            </div>
          </div>

          {analytics.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
              No recent analytics activity yet.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.slice(0, 12).map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold capitalize text-white">
                      {formatEventName(event.event || "unknown")}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  </div>

                  <p className="mt-1 text-xs text-zinc-500">
                    {event.source || event.page || "CreatorOS AI"}
                  </p>

                  {event.revenue ? (
                    <p className="mt-2 text-xs font-bold text-yellow-200">
                      Revenue: {formatCurrency(Number(event.revenue))}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}