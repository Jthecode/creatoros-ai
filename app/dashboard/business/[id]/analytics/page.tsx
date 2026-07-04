import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Bot,
  DollarSign,
  Eye,
  Filter,
  MousePointerClick,
  Package,
  Rocket,
  ShoppingBag,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
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
  total?: number | null;
  total_cents?: number | null;
  customer_email: string | null;
  payment_status?: string | null;
  status?: string | null;
  created_at: string;
};

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

type ConversionEventRow = {
  id: string;
  business_id: string;
  funnel_id: string | null;
  funnel_page_id: string | null;
  lead_form_id: string | null;
  funnel_submission_id: string | null;
  lead_id: string | null;
  order_id: string | null;
  event_name: string;
  event_type:
    | "page_view"
    | "cta_click"
    | "form_view"
    | "form_submit"
    | "lead_created"
    | "booking_request"
    | "checkout_click"
    | "purchase"
    | "custom";
  value_cents: number | null;
  currency: string | null;
  source: string | null;
  page_url: string | null;
  referrer: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type FunnelSubmissionRow = {
  id: string;
  business_id: string;
  funnel_id: string | null;
  funnel_page_id: string | null;
  lead_form_id: string | null;
  lead_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  page_url: string | null;
  created_at: string;
};

type FunnelSummaryRow = {
  funnel_id: string;
  business_id: string;
  funnel_name: string;
  funnel_slug: string;
  funnel_status: string | null;
  is_published: boolean | null;
  page_views: number | null;
  cta_clicks: number | null;
  submissions: number | null;
  leads_created: number | null;
  purchases: number | null;
  revenue_cents: number | null;
  submission_rate: number | null;
  last_activity_at: string | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatCurrencyFromCents(cents: number) {
  return formatCurrency(cents / 100);
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function getOrderTotal(order: OrderRow) {
  if (typeof order.total === "number") return order.total;
  if (typeof order.total_cents === "number") return order.total_cents / 100;
  return 0;
}

function getOrderStatus(order: OrderRow) {
  return order.payment_status || order.status || "pending";
}

function countEvents(events: AnalyticsEventRow[], eventName: string) {
  return events.filter((event) => event.event === eventName).length;
}

function countConversionEvents(
  events: ConversionEventRow[],
  eventType: ConversionEventRow["event_type"]
) {
  return events.filter((event) => event.event_type === eventType).length;
}

function getFunnelEventLabel(eventType: string) {
  return eventType.replaceAll("_", " ");
}

async function loadAnalytics(id: string) {
  const [
    businessResult,
    productsResult,
    agentsResult,
    ordersResult,
    leadsResult,
    analyticsResult,
    conversionEventsResult,
    funnelSubmissionsResult,
    funnelSummaryResult,
  ] = await Promise.all([
    supabaseAdmin.from("businesses").select("id, name, slug").eq("id", id).single(),

    supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("ai_agents")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("orders")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("analytics_events")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(500),

    supabaseAdmin
      .from("conversion_events")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(500),

    supabaseAdmin
      .from("funnel_submissions")
      .select(
        "id, business_id, funnel_id, funnel_page_id, lead_form_id, lead_id, name, email, phone, company, message, source, status, page_url, created_at"
      )
      .eq("business_id", id)
      .order("created_at", { ascending: false })
      .limit(500),

    supabaseAdmin
      .from("funnel_conversion_summary")
      .select("*")
      .eq("business_id", id)
      .order("last_activity_at", { ascending: false, nullsFirst: false }),
  ]);

  if (businessResult.error || !businessResult.data) return null;

  if (productsResult.error) throw productsResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (leadsResult.error) throw leadsResult.error;
  if (analyticsResult.error) throw analyticsResult.error;
  if (conversionEventsResult.error) throw conversionEventsResult.error;
  if (funnelSubmissionsResult.error) throw funnelSubmissionsResult.error;

  const business = businessResult.data as BusinessRow;
  const orders = (ordersResult.data ?? []) as OrderRow[];
  const analytics = (analyticsResult.data ?? []) as AnalyticsEventRow[];
  const conversionEvents =
    (conversionEventsResult.data ?? []) as ConversionEventRow[];
  const funnelSubmissions =
    (funnelSubmissionsResult.data ?? []) as FunnelSubmissionRow[];

  const funnelSummary = funnelSummaryResult.error
    ? []
    : ((funnelSummaryResult.data ?? []) as FunnelSummaryRow[]);

  const paidOrders = orders.filter((order) => {
    const status = getOrderStatus(order);
    return status === "paid" || status === "completed" || status === "succeeded";
  });

  const revenueFromOrders = paidOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const revenueFromAnalytics = analytics.reduce(
    (sum, event) => sum + Number(event.revenue ?? 0),
    0
  );

  const revenue = revenueFromOrders > 0 ? revenueFromOrders : revenueFromAnalytics;

  const customers = new Set(
    orders.map((order) => order.customer_email).filter(Boolean)
  );

  const visitors =
    countEvents(analytics, "storefront_view") +
    countEvents(analytics, "page_view") +
    countEvents(analytics, "dashboard_view");

  const productViews = countEvents(analytics, "product_view");
  const checkoutStarts = countEvents(analytics, "checkout_started");
  const checkoutCompleted =
    countEvents(analytics, "checkout_completed") +
    countEvents(analytics, "product_purchase");

  const conversionRate =
    visitors > 0 ? Math.round((checkoutCompleted / visitors) * 100) : 0;

  const funnelPageViews = countConversionEvents(conversionEvents, "page_view");
  const funnelCtaClicks = countConversionEvents(conversionEvents, "cta_click");
  const funnelFormViews = countConversionEvents(conversionEvents, "form_view");
  const funnelFormSubmits = countConversionEvents(conversionEvents, "form_submit");
  const funnelLeadsCreated = countConversionEvents(
    conversionEvents,
    "lead_created"
  );
  const funnelCheckoutClicks = countConversionEvents(
    conversionEvents,
    "checkout_click"
  );
  const funnelPurchases = countConversionEvents(conversionEvents, "purchase");

  const funnelRevenueCents = conversionEvents
    .filter((event) => event.event_type === "purchase")
    .reduce((sum, event) => sum + Number(event.value_cents ?? 0), 0);

  const funnelConversionRate =
    funnelPageViews > 0
      ? Math.round((funnelFormSubmits / funnelPageViews) * 100)
      : 0;

  const eventCounts = analytics.reduce<Record<string, number>>((acc, item) => {
    const key = item.event || "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const topEvents = Object.entries(eventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const funnelEventCounts = conversionEvents.reduce<Record<string, number>>(
    (acc, item) => {
      const key = item.event_type || "custom";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const topFunnelEvents = Object.entries(funnelEventCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return {
    business,
    stats: {
      revenue,
      orders: orders.length,
      paidOrders: paidOrders.length,
      customers: customers.size,
      products: productsResult.count ?? 0,
      aiAgents: agentsResult.count ?? 0,
      leads: leadsResult.count ?? 0,
      visitors,
      productViews,
      checkoutStarts,
      checkoutCompleted,
      conversionRate,
      totalEvents: analytics.length,
      funnelPageViews,
      funnelCtaClicks,
      funnelFormViews,
      funnelFormSubmits,
      funnelLeadsCreated,
      funnelCheckoutClicks,
      funnelPurchases,
      funnelRevenueCents,
      funnelConversionRate,
      funnelSubmissions: funnelSubmissions.length,
      funnelEvents: conversionEvents.length,
      funnels: funnelSummary.length,
    },
    orders,
    analytics,
    conversionEvents,
    funnelSubmissions,
    funnelSummary,
    topEvents,
    topFunnelEvents,
  };
}

export default async function AnalyticsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadAnalytics(id);

  if (!data) {
    notFound();
  }

  const {
    business,
    stats,
    orders,
    analytics,
    conversionEvents,
    funnelSubmissions,
    funnelSummary,
    topEvents,
    topFunnelEvents,
  } = data;

  const cards = [
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
    },
    {
      label: "Orders",
      value: stats.orders.toString(),
      icon: ShoppingBag,
    },
    {
      label: "Customers",
      value: stats.customers.toString(),
      icon: Users,
    },
    {
      label: "Leads",
      value: stats.leads.toString(),
      icon: Users,
    },
    {
      label: "Visitors",
      value: stats.visitors.toString(),
      icon: Eye,
    },
    {
      label: "Product Views",
      value: stats.productViews.toString(),
      icon: Package,
    },
    {
      label: "Checkout Starts",
      value: stats.checkoutStarts.toString(),
      icon: MousePointerClick,
    },
    {
      label: "Conversion",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
    },
    {
      label: "Funnel Views",
      value: stats.funnelPageViews.toString(),
      icon: Rocket,
    },
    {
      label: "Funnel Leads",
      value: stats.funnelLeadsCreated.toString(),
      icon: Target,
    },
    {
      label: "Funnel Conv.",
      value: `${stats.funnelConversionRate}%`,
      icon: Filter,
    },
    {
      label: "Tracked Events",
      value: (stats.totalEvents + stats.funnelEvents).toString(),
      icon: Zap,
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

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                <BarChart3 className="h-3.5 w-3.5" />
                AI Analytics
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {business.name} Analytics
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                Track revenue, orders, customers, leads, storefront traffic,
                funnel conversions, product activity, AI employee performance,
                and marketplace events from one CreatorOS AI command center.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/business/${business.id}/funnels`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Rocket className="h-4 w-4" />
                  Open Funnel Builder
                </Link>

                <Link
                  href={`/dashboard/business/${business.id}/crm`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Users className="h-4 w-4" />
                  View CRM Leads
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

                <h2 className="mt-2 text-3xl font-black">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
                <Rocket className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black text-yellow-100">
                  Funnel Performance
                </h2>
                <p className="text-sm text-yellow-100/65">
                  Page views, submissions, leads, and revenue from public funnels.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-6">
              <p className="text-sm text-yellow-100/65">Funnel Conversion Rate</p>

              <h3 className="mt-3 text-5xl font-black text-yellow-100">
                {stats.funnelConversionRate}%
              </h3>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-yellow-400/20 bg-white/[0.03] p-4">
                  <p className="text-xs text-yellow-100/60">Views</p>
                  <p className="mt-2 text-2xl font-black">
                    {stats.funnelPageViews}
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-400/20 bg-white/[0.03] p-4">
                  <p className="text-xs text-yellow-100/60">Submits</p>
                  <p className="mt-2 text-2xl font-black">
                    {stats.funnelFormSubmits}
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-400/20 bg-white/[0.03] p-4">
                  <p className="text-xs text-yellow-100/60">Leads</p>
                  <p className="mt-2 text-2xl font-black">
                    {stats.funnelLeadsCreated}
                  </p>
                </div>

                <div className="rounded-2xl border border-yellow-400/20 bg-white/[0.03] p-4">
                  <p className="text-xs text-yellow-100/60">Revenue</p>
                  <p className="mt-2 text-2xl font-black">
                    {formatCurrencyFromCents(stats.funnelRevenueCents)}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-yellow-100/65">
                Funnel analytics are powered by conversion events and funnel form
                submissions. Submit a test lead from a public funnel page to see
                this section update.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">AI Insight Summary</h2>
                <p className="text-sm text-zinc-500">Smart business readout.</p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-6 text-zinc-300">
              <p>
                CreatorOS AI is now tracking the main business signals: revenue,
                products, orders, visitors, leads, funnel views, funnel form
                submissions, checkouts, AI usage, and customer activity.
              </p>

              <p>
                Once more funnel activity comes in, this page can recommend
                stronger CTAs, better lead capture copy, upsells, follow-up
                automation, and the next best conversion move.
              </p>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-yellow-100/80">
                Current focus: connect funnel submissions to CRM, analytics, and
                automated follow-up so every funnel turns into a real business
                pipeline.
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <TrendingUp className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Business Growth</h2>
                <p className="text-sm text-zinc-500">
                  Revenue, checkout, and conversion snapshot.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <p className="text-sm text-zinc-400">Revenue Snapshot</p>

              <h3 className="mt-3 text-5xl font-black text-yellow-300">
                {formatCurrency(stats.revenue)}
              </h3>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-zinc-500">Checkout Starts</p>
                  <p className="mt-2 text-2xl font-black">
                    {stats.checkoutStarts}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-zinc-500">Completed</p>
                  <p className="mt-2 text-2xl font-black">
                    {stats.checkoutCompleted}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-xs text-zinc-500">Conversion</p>
                  <p className="mt-2 text-2xl font-black">
                    {stats.conversionRate}%
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-400">
                Revenue updates from completed Stripe checkout orders and tracked
                analytics events.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Target className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Funnel Snapshot</h2>
                <p className="text-sm text-zinc-500">
                  Current funnel pipeline totals.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-sm font-bold text-zinc-300">
                  Active Funnels
                </span>
                <span className="font-black text-yellow-200">{stats.funnels}</span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-sm font-bold text-zinc-300">
                  Funnel Submissions
                </span>
                <span className="font-black text-yellow-200">
                  {stats.funnelSubmissions}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-sm font-bold text-zinc-300">
                  CTA Clicks
                </span>
                <span className="font-black text-yellow-200">
                  {stats.funnelCtaClicks}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-sm font-bold text-zinc-300">
                  Checkout Clicks
                </span>
                <span className="font-black text-yellow-200">
                  {stats.funnelCheckoutClicks}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4">
                <span className="text-sm font-bold text-zinc-300">
                  Purchases
                </span>
                <span className="font-black text-yellow-200">
                  {stats.funnelPurchases}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Rocket className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Funnels</h2>
                <p className="text-sm text-zinc-500">
                  Performance by funnel.
                </p>
              </div>
            </div>

            {funnelSummary.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
                No funnel summary yet. Create a funnel and submit a lead form to
                start tracking performance.
              </p>
            ) : (
              <div className="space-y-3">
                {funnelSummary.slice(0, 8).map((funnel) => (
                  <div
                    key={funnel.funnel_id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-black">{funnel.funnel_name}</h3>
                        <p className="mt-1 font-mono text-xs text-zinc-600">
                          /funnel/{business.slug || "business"}/
                          {funnel.funnel_slug}
                        </p>
                      </div>

                      <span
                        className={
                          funnel.is_published
                            ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                            : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-zinc-400"
                        }
                      >
                        {funnel.is_published ? "Live" : funnel.funnel_status || "Draft"}
                      </span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-4">
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] text-zinc-500">Views</p>
                        <p className="mt-1 font-black">
                          {funnel.page_views ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] text-zinc-500">Submits</p>
                        <p className="mt-1 font-black">
                          {funnel.submissions ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] text-zinc-500">Rate</p>
                        <p className="mt-1 font-black">
                          {formatPercent(Number(funnel.submission_rate ?? 0))}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-[11px] text-zinc-500">Revenue</p>
                        <p className="mt-1 font-black">
                          {formatCurrencyFromCents(Number(funnel.revenue_cents ?? 0))}
                        </p>
                      </div>
                    </div>

                    {business.slug ? (
                      <Link
                        href={`/funnel/${business.slug}/${funnel.funnel_slug}`}
                        target="_blank"
                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-200 transition hover:bg-yellow-400/20"
                      >
                        <Eye className="h-4 w-4" />
                        Preview Funnel
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Zap className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Top Funnel Events</h2>
                <p className="text-sm text-zinc-500">
                  Most common funnel conversion signals.
                </p>
              </div>
            </div>

            {topFunnelEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
                No funnel conversion events yet. Funnel page views, form
                submissions, and lead-created events will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {topFunnelEvents.map(([event, count]) => (
                  <div
                    key={event}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <p className="font-bold capitalize text-zinc-200">
                      {getFunnelEventLabel(event)}
                    </p>

                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Zap className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Top Business Events</h2>
                <p className="text-sm text-zinc-500">
                  Most common analytics signals.
                </p>
              </div>
            </div>

            {topEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
                No analytics events yet. Events will appear after storefront
                visits, product views, checkouts, AI chats, and marketplace
                installs.
              </p>
            ) : (
              <div className="space-y-3">
                {topEvents.map(([event, count]) => (
                  <div
                    key={event}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <p className="font-bold capitalize text-zinc-200">
                      {event.replaceAll("_", " ")}
                    </p>

                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Eye className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Recent Funnel Activity</h2>
                <p className="text-sm text-zinc-500">
                  Latest tracked funnel events.
                </p>
              </div>
            </div>

            {conversionEvents.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
                No recent funnel activity yet.
              </p>
            ) : (
              <div className="space-y-3">
                {conversionEvents.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold capitalize">
                        {event.event_name || event.event_type.replaceAll("_", " ")}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <p className="mt-1 text-xs capitalize text-zinc-500">
                      {event.event_type.replaceAll("_", " ")}
                    </p>

                    {event.page_url ? (
                      <p className="mt-2 truncate font-mono text-xs text-zinc-600">
                        {event.page_url}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Recent Funnel Leads</h2>
                <p className="text-sm text-zinc-500">
                  Latest form submissions from public funnels.
                </p>
              </div>
            </div>

            {funnelSubmissions.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
                No funnel submissions yet. Public funnel form submissions will
                appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {funnelSubmissions.slice(0, 8).map((submission) => (
                  <div
                    key={submission.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold">
                          {submission.name ||
                            submission.email ||
                            submission.phone ||
                            "New Funnel Lead"}
                        </h3>

                        <p className="mt-1 text-xs text-zinc-500">
                          {submission.email || submission.phone || "No contact info"}
                        </p>
                      </div>

                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">
                        {submission.status || "new"}
                      </span>
                    </div>

                    {submission.message ? (
                      <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
                        {submission.message}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Eye className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Recent Business Activity</h2>
                <p className="text-sm text-zinc-500">
                  Latest tracked platform events.
                </p>
              </div>
            </div>

            {analytics.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
                No recent activity yet.
              </p>
            ) : (
              <div className="space-y-3">
                {analytics.slice(0, 8).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold capitalize">
                        {(event.event || "unknown").replaceAll("_", " ")}
                      </p>

                      <p className="text-xs text-zinc-500">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">
                      {event.source || event.page || "CreatorOS AI"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <ShoppingBag className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black">Recent Orders</h2>
              <p className="text-sm text-zinc-500">
                Latest business purchases and checkout records.
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-sm leading-6 text-zinc-400">
              No orders yet. Completed Stripe purchases will appear here after
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
                      {getOrderStatus(order)}
                    </p>
                  </div>

                  <p className="font-black text-yellow-300">
                    {formatCurrency(getOrderTotal(order))}
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