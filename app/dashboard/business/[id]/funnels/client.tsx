"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  Loader2,
  MousePointerClick,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";

type Business = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

type FunnelPage = {
  id: string;
  title: string;
  slug: string;
  type: string;
  page_type?: string | null;
  sort_order: number;
  status: string;
  is_published?: boolean | null;
  created_at: string;
};

type Funnel = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  goal: string | null;
  status: string;
  is_published?: boolean | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
  funnel_pages?: FunnelPage[];
};

type ConversionEvent = {
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
  created_at: string;
  metadata?: Record<string, unknown> | null;
};

type ConversionTotals = {
  pageViews: number;
  ctaClicks: number;
  formViews: number;
  formSubmits: number;
  leadsCreated: number;
  checkoutClicks: number;
  purchases: number;
  revenueCents: number;
};

type ConversionResponse = {
  events: ConversionEvent[];
  totals: ConversionTotals;
};

type Props = {
  business: Business;
  initialFunnels: Funnel[];
};

const emptyConversionTotals: ConversionTotals = {
  pageViews: 0,
  ctaClicks: 0,
  formViews: 0,
  formSubmits: 0,
  leadsCreated: 0,
  checkoutClicks: 0,
  purchases: 0,
  revenueCents: 0,
};

const starterFunnels = [
  {
    name: "Lead Capture Funnel",
    goal: "Capture qualified leads and send them into CRM follow-up.",
    description:
      "Landing page, email capture, thank-you page, and automated follow-up.",
  },
  {
    name: "Product Launch Funnel",
    goal: "Sell a product or service with checkout and upsell flow.",
    description:
      "Sales page, checkout page, upsell page, and thank-you page.",
  },
  {
    name: "Service Booking Funnel",
    goal: "Turn visitors into booked calls or appointments.",
    description:
      "Landing page, offer page, booking CTA, FAQ, and follow-up page.",
  },
];

const funnelPageTemplates = [
  {
    title: "Landing Page",
    slug: "landing",
    type: "landing",
    sort_order: 1,
  },
  {
    title: "Offer Page",
    slug: "offer",
    type: "offer",
    sort_order: 2,
  },
  {
    title: "Lead Capture Page",
    slug: "lead-capture",
    type: "lead_capture",
    sort_order: 3,
  },
  {
    title: "Thank You Page",
    slug: "thank-you",
    type: "thank_you",
    sort_order: 4,
  },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function formatPercent(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

function getFunnelIsPublished(funnel: Funnel) {
  return funnel.is_published === true || funnel.status === "published";
}

function getPageType(page: FunnelPage) {
  return page.page_type || page.type || "page";
}

function buildStarterPageHtml(params: {
  business: Business;
  funnelName: string;
  pageTitle: string;
  type: string;
}) {
  const { business, funnelName, pageTitle, type } = params;

  if (type === "offer") {
    return `
      <section>
        <p>${business.name}</p>
        <h1>See The Offer</h1>
        <p>Position your service, product, or package with clear value, benefits, and a strong call-to-action.</p>
      </section>
    `.trim();
  }

  if (type === "lead_capture") {
    return `
      <section>
        <p>Get Started</p>
        <h1>Submit Your Information</h1>
        <p>Capture qualified leads and send them into CreatorOS AI CRM and conversion tracking.</p>
      </section>
    `.trim();
  }

  if (type === "thank_you") {
    return `
      <section>
        <p>Thank You</p>
        <h1>Your Next Step Is Ready</h1>
        <p>Thanks for taking action with ${business.name}. We will follow up soon.</p>
      </section>
    `.trim();
  }

  return `
    <section>
      <p>${business.name}</p>
      <h1>${pageTitle}</h1>
      <p>${business.description || `${funnelName} was generated with CreatorOS AI.`}</p>
    </section>
  `.trim();
}

function calculateTotals(events: ConversionEvent[]): ConversionTotals {
  return {
    pageViews: events.filter((event) => event.event_type === "page_view")
      .length,
    ctaClicks: events.filter((event) => event.event_type === "cta_click")
      .length,
    formViews: events.filter((event) => event.event_type === "form_view")
      .length,
    formSubmits: events.filter((event) => event.event_type === "form_submit")
      .length,
    leadsCreated: events.filter((event) => event.event_type === "lead_created")
      .length,
    checkoutClicks: events.filter(
      (event) => event.event_type === "checkout_click"
    ).length,
    purchases: events.filter((event) => event.event_type === "purchase").length,
    revenueCents: events
      .filter((event) => event.event_type === "purchase")
      .reduce((sum, event) => sum + Number(event.value_cents ?? 0), 0),
  };
}

async function fetchConversionEvents(
  businessId: string
): Promise<ConversionResponse> {
  const res = await fetch(
    `/api/conversion-events?businessId=${businessId}&limit=100`,
    {
      cache: "no-store",
    }
  );

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Unable to load conversion events.");
  }

  const events = Array.isArray(data.events)
    ? (data.events as ConversionEvent[])
    : [];

  const totals = data.totals
    ? (data.totals as ConversionTotals)
    : calculateTotals(events);

  return {
    events,
    totals,
  };
}

export default function FunnelsClient({ business, initialFunnels }: Props) {
  const [funnels, setFunnels] = useState<Funnel[]>(initialFunnels);
  const [conversionEvents, setConversionEvents] = useState<ConversionEvent[]>(
    []
  );
  const [conversionTotals, setConversionTotals] =
    useState<ConversionTotals>(emptyConversionTotals);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [query, setQuery] = useState("");

  const [saving, setSaving] = useState(false);
  const [loadingConversions, setLoadingConversions] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const filteredFunnels = useMemo(() => {
    const search = query.toLowerCase();

    return funnels.filter((funnel) => {
      return (
        funnel.name.toLowerCase().includes(search) ||
        funnel.slug.toLowerCase().includes(search) ||
        (funnel.goal ?? "").toLowerCase().includes(search) ||
        (funnel.description ?? "").toLowerCase().includes(search)
      );
    });
  }, [funnels, query]);

  const publishedCount = useMemo(
    () => funnels.filter((funnel) => getFunnelIsPublished(funnel)).length,
    [funnels]
  );

  const totalPages = useMemo(
    () =>
      funnels.reduce(
        (sum, funnel) => sum + (funnel.funnel_pages?.length ?? 0),
        0
      ),
    [funnels]
  );

  const conversionRate = useMemo(() => {
    if (conversionTotals.pageViews === 0) return 0;

    return (conversionTotals.formSubmits / conversionTotals.pageViews) * 100;
  }, [conversionTotals.formSubmits, conversionTotals.pageViews]);

  const funnelEventMap = useMemo(() => {
    const map = new Map<string, ConversionEvent[]>();

    for (const event of conversionEvents) {
      if (!event.funnel_id) continue;

      const existing = map.get(event.funnel_id) ?? [];
      existing.push(event);
      map.set(event.funnel_id, existing);
    }

    return map;
  }, [conversionEvents]);

  function resetForm() {
    setName("");
    setSlug("");
    setGoal("");
    setDescription("");
    setStatus("draft");
  }

  async function loadConversionEventsManually() {
    try {
      setLoadingConversions(true);

      const data = await fetchConversionEvents(business.id);

      setConversionEvents(data.events);
      setConversionTotals(data.totals);
    } catch (loadError) {
      console.error(loadError);
    } finally {
      setLoadingConversions(false);
    }
  }

  async function refreshFunnels() {
    try {
      setBusyId("refresh");
      setError("");
      setSuccess("");

      const res = await fetch(`/api/funnels?businessId=${business.id}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to refresh funnels.");
      }

      setFunnels(Array.isArray(data.funnels) ? data.funnels : []);

      const conversionData = await fetchConversionEvents(business.id);

      setConversionEvents(conversionData.events);
      setConversionTotals(conversionData.totals);
      setSuccess("Funnels and conversions refreshed.");
    } catch (refreshError) {
      console.error(refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh funnels."
      );
    } finally {
      setBusyId("");
    }
  }

  async function createFunnel(template?: (typeof starterFunnels)[number]) {
    const funnelName = (template?.name ?? name).trim();
    const funnelGoal = (template?.goal ?? goal).trim();
    const funnelDescription = (template?.description ?? description).trim();

    if (!funnelName || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/funnels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          name: funnelName,
          slug: slug || slugify(funnelName),
          description: funnelDescription,
          goal: funnelGoal,
          status,
          is_published: status === "published",
          metadata: {
            generatedBy: template ? "starter_template" : "manual",
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to create funnel.");
      }

      const createdFunnel = data.funnel as Funnel;

      setFunnels((current) => [
        {
          ...createdFunnel,
          is_published:
            createdFunnel.is_published ?? createdFunnel.status === "published",
          funnel_pages: [],
        },
        ...current,
      ]);

      resetForm();
      setSuccess("Funnel created.");
    } catch (createError) {
      console.error(createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create funnel."
      );
    } finally {
      setSaving(false);
    }
  }

  async function createStarterPages(funnel: Funnel) {
    try {
      setBusyId(funnel.id);
      setError("");
      setSuccess("");

      const createdPages: FunnelPage[] = [];
      const publishPages = getFunnelIsPublished(funnel);

      for (const template of funnelPageTemplates) {
        const res = await fetch("/api/funnel-pages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            funnelId: funnel.id,
            businessId: business.id,
            title: template.title,
            slug: template.slug,
            type: template.type,
            page_type: template.type,
            sort_order: template.sort_order,
            status: publishPages ? "published" : "draft",
            is_published: publishPages,
            seo_title: `${template.title} | ${funnel.name}`,
            seo_description:
              funnel.description ||
              `${template.title} for ${funnel.name} by ${business.name}.`,
            headline:
              template.type === "landing"
                ? `${business.name} is ready to help you.`
                : template.title,
            subheadline:
              funnel.goal ||
              funnel.description ||
              `${template.title} for ${funnel.name}.`,
            body:
              template.type === "lead_capture"
                ? "Submit your information and this business will receive your lead inside CreatorOS AI CRM."
                : funnel.description ||
                  "This funnel page was generated with CreatorOS AI.",
            cta_text:
              template.type === "thank_you"
                ? "Back To Website"
                : template.type === "lead_capture"
                  ? "Submit Info"
                  : "Continue",
            cta_url: "",
            html_content: buildStarterPageHtml({
              business,
              funnelName: funnel.name,
              pageTitle: template.title,
              type: template.type,
            }),
            content: {
              generatedBy: "CreatorOS AI",
              funnelName: funnel.name,
              pageType: template.type,
            },
          }),
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Unable to create funnel page.");
        }

        createdPages.push(data.page as FunnelPage);
      }

      setFunnels((current) =>
        current.map((item) =>
          item.id === funnel.id
            ? {
                ...item,
                funnel_pages: [
                  ...(item.funnel_pages ?? []),
                  ...createdPages,
                ].sort((a, b) => a.sort_order - b.sort_order),
              }
            : item
        )
      );

      setSuccess("Starter funnel pages created.");
    } catch (pagesError) {
      console.error(pagesError);
      setError(
        pagesError instanceof Error
          ? pagesError.message
          : "Unable to create starter pages."
      );
    } finally {
      setBusyId("");
    }
  }

  async function toggleFunnelStatus(funnel: Funnel) {
    const nextStatus = getFunnelIsPublished(funnel) ? "draft" : "published";

    try {
      setBusyId(funnel.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/funnels", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: funnel.id,
          status: nextStatus,
          is_published: nextStatus === "published",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update funnel.");
      }

      setFunnels((current) =>
        current.map((item) =>
          item.id === funnel.id
            ? {
                ...item,
                ...(data.funnel as Funnel),
                is_published:
                  (data.funnel as Funnel).is_published ??
                  (data.funnel as Funnel).status === "published",
                funnel_pages: item.funnel_pages ?? [],
              }
            : item
        )
      );

      setSuccess(
        nextStatus === "published"
          ? "Funnel published."
          : "Funnel moved to draft."
      );
    } catch (statusError) {
      console.error(statusError);
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Unable to update funnel."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteFunnel(funnel: Funnel) {
    try {
      setBusyId(funnel.id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/funnels?id=${funnel.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to delete funnel.");
      }

      setFunnels((current) => current.filter((item) => item.id !== funnel.id));
      setConversionEvents((current) =>
        current.filter((event) => event.funnel_id !== funnel.id)
      );
      setSuccess("Funnel deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete funnel."
      );
    } finally {
      setBusyId("");
    }
  }

  useEffect(() => {
    let ignore = false;

    fetchConversionEvents(business.id)
      .then((data) => {
        if (ignore) return;

        setConversionEvents(data.events);
        setConversionTotals(data.totals);
      })
      .catch((loadError) => {
        if (!ignore) {
          console.error(loadError);
        }
      });

    return () => {
      ignore = true;
    };
  }, [business.id]);

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <Flame className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-zinc-500">Funnels</p>
          <p className="mt-2 text-3xl font-black">{funnels.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <Globe className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-zinc-500">Published</p>
          <p className="mt-2 text-3xl font-black">{publishedCount}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <FileText className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-zinc-500">Funnel Pages</p>
          <p className="mt-2 text-3xl font-black">{totalPages}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <Users className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-zinc-500">Leads Created</p>
          <p className="mt-2 text-3xl font-black">
            {conversionTotals.leadsCreated}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <Eye className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-yellow-100/60">Page Views</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">
            {conversionTotals.pageViews}
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <MousePointerClick className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-yellow-100/60">CTA Clicks</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">
            {conversionTotals.ctaClicks}
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <BarChart3 className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-yellow-100/60">Form Submits</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">
            {conversionTotals.formSubmits}
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <Filter className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-yellow-100/60">Conversion Rate</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">
            {formatPercent(conversionRate)}
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <DollarSign className="h-6 w-6 text-yellow-200" />
          <p className="mt-4 text-xs text-yellow-100/60">Revenue Tracked</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">
            {formatCurrency(conversionTotals.revenueCents)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Filter className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Create Funnel</h2>
                <p className="text-sm text-zinc-500">
                  Build a revenue flow for this business.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slug) setSlug(slugify(event.target.value));
                }}
                placeholder="Funnel name"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="funnel-slug"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <textarea
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Funnel goal"
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Funnel description"
                rows={4}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>

              <button
                type="button"
                onClick={() => createFunnel()}
                disabled={saving || !name.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Funnel
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
            <h3 className="font-black text-yellow-100">
              Starter Funnel Templates
            </h3>

            <div className="mt-4 grid gap-3">
              {starterFunnels.map((template) => (
                <button
                  key={template.name}
                  type="button"
                  onClick={() => createFunnel(template)}
                  disabled={saving}
                  className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4 text-left transition hover:bg-yellow-400/10 disabled:opacity-60"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-200" />
                    <p className="font-black text-yellow-100">
                      {template.name}
                    </p>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black">Conversion Events</h3>
                <p className="mt-1 text-sm text-zinc-500">
                  Latest tracked funnel activity.
                </p>
              </div>

              <button
                type="button"
                onClick={loadConversionEventsManually}
                disabled={loadingConversions}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200 disabled:opacity-60"
              >
                {loadingConversions ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BarChart3 className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {conversionEvents.slice(0, 6).length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-5 text-center">
                  <BarChart3 className="mx-auto h-8 w-8 text-zinc-600" />
                  <p className="mt-3 text-sm leading-6 text-zinc-500">
                    No funnel activity tracked yet. Open a public funnel preview
                    and submit the form to test conversions.
                  </p>
                </div>
              ) : (
                conversionEvents.slice(0, 6).map((event) => (
                  <div
                    key={event.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">{event.event_name}</p>
                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                          {event.event_type.replaceAll("_", " ")}
                        </p>
                      </div>

                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">
                        Funnel
                      </span>
                    </div>

                    {event.page_url ? (
                      <p className="mt-2 truncate font-mono text-xs text-zinc-600">
                        {event.page_url}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">Funnels</h2>
              <p className="text-sm text-zinc-500">
                Manage funnel flows, pages, status, previews, leads, and
                conversions.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />

                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search funnels..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 sm:w-72"
                />
              </div>

              <button
                type="button"
                onClick={refreshFunnels}
                disabled={busyId === "refresh"}
                className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200 disabled:opacity-60"
              >
                {busyId === "refresh" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Refresh"
                )}
              </button>
            </div>
          </div>

          {filteredFunnels.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
              <Flame className="mx-auto h-10 w-10 text-zinc-600" />
              <h3 className="mt-4 font-black">No funnels found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Create your first AI funnel or install one of the starter
                templates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFunnels.map((funnel) => {
                const busy = busyId === funnel.id;
                const pageCount = funnel.funnel_pages?.length ?? 0;
                const previewHref = business.slug
                  ? `/funnel/${business.slug}/${funnel.slug}`
                  : "#";

                const funnelEvents = funnelEventMap.get(funnel.id) ?? [];
                const funnelTotals = calculateTotals(funnelEvents);
                const funnelConversionRate =
                  funnelTotals.pageViews > 0
                    ? (funnelTotals.formSubmits / funnelTotals.pageViews) * 100
                    : 0;

                return (
                  <div
                    key={funnel.id}
                    className="rounded-3xl border border-white/10 bg-black/40 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black">{funnel.name}</h3>

                          <span
                            className={
                              getFunnelIsPublished(funnel)
                                ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black capitalize text-emerald-300"
                                : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400"
                            }
                          >
                            {getFunnelIsPublished(funnel)
                              ? "published"
                              : funnel.status}
                          </span>

                          <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                            {pageCount} page{pageCount === 1 ? "" : "s"}
                          </span>
                        </div>

                        <p className="mt-2 font-mono text-xs text-zinc-500">
                          /funnel/{business.slug || "business"}/{funnel.slug}
                        </p>

                        {funnel.goal ? (
                          <p className="mt-4 text-sm leading-6 text-yellow-100/75">
                            <span className="font-black text-yellow-200">
                              Goal:
                            </span>{" "}
                            {funnel.goal}
                          </p>
                        ) : null}

                        {funnel.description ? (
                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {funnel.description}
                          </p>
                        ) : null}

                        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                              Views
                            </p>
                            <p className="mt-1 text-xl font-black">
                              {funnelTotals.pageViews}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                              Leads
                            </p>
                            <p className="mt-1 text-xl font-black">
                              {funnelTotals.leadsCreated}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                              Submit Rate
                            </p>
                            <p className="mt-1 text-xl font-black">
                              {formatPercent(funnelConversionRate)}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-zinc-500">
                              Revenue
                            </p>
                            <p className="mt-1 text-xl font-black">
                              {formatCurrency(funnelTotals.revenueCents)}
                            </p>
                          </div>
                        </div>

                        {pageCount > 0 ? (
                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {(funnel.funnel_pages ?? [])
                              .slice()
                              .sort((a, b) => a.sort_order - b.sort_order)
                              .map((page) => (
                                <div
                                  key={page.id}
                                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-sm font-bold">
                                      {page.sort_order}. {page.title}
                                    </p>

                                    <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-zinc-400">
                                      {getPageType(page).replaceAll("_", " ")}
                                    </span>
                                  </div>

                                  <p className="mt-1 font-mono text-[11px] text-zinc-600">
                                    /{page.slug}
                                  </p>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-black/30 p-4">
                            <p className="text-sm leading-6 text-zinc-500">
                              No funnel pages yet. Add starter pages to create
                              landing, offer, lead capture, and thank-you steps.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                        {business.slug ? (
                          <Link
                            href={previewHref}
                            target="_blank"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Link>
                        ) : null}

                        {pageCount === 0 ? (
                          <button
                            type="button"
                            onClick={() => createStarterPages(funnel)}
                            disabled={busy}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs font-bold text-yellow-200 transition hover:bg-yellow-400/20 disabled:opacity-60"
                          >
                            {busy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="h-4 w-4" />
                            )}
                            Add Pages
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => toggleFunnelStatus(funnel)}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                          {getFunnelIsPublished(funnel) ? "Draft" : "Publish"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteFunnel(funnel)}
                          disabled={busy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs font-bold text-red-300 transition hover:bg-red-400/20 disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}