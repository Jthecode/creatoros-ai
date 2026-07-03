"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  Flame,
  Globe,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
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
  sort_order: number;
  status: string;
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
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
  funnel_pages?: FunnelPage[];
};

type Props = {
  business: Business;
  initialFunnels: Funnel[];
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
    title: "Checkout Page",
    slug: "checkout",
    type: "checkout",
    sort_order: 2,
  },
  {
    title: "Upsell Page",
    slug: "upsell",
    type: "upsell",
    sort_order: 3,
  },
  {
    title: "Thank You Page",
    slug: "thank-you",
    type: "thank-you",
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

function buildStarterPageHtml(params: {
  business: Business;
  funnelName: string;
  pageTitle: string;
  type: string;
}) {
  const { business, funnelName, pageTitle, type } = params;

  if (type === "checkout") {
    return `
      <section>
        <p>${business.name}</p>
        <h1>Complete Your Order</h1>
        <p>Secure your spot, purchase, or service package through this checkout step.</p>
      </section>
    `.trim();
  }

  if (type === "upsell") {
    return `
      <section>
        <p>Special Offer</p>
        <h1>Upgrade Your Results</h1>
        <p>Add an extra service, product, or premium option before finishing your order.</p>
      </section>
    `.trim();
  }

  if (type === "thank-you") {
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

export default function FunnelsClient({ business, initialFunnels }: Props) {
  const [funnels, setFunnels] = useState<Funnel[]>(initialFunnels);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");
  const [query, setQuery] = useState("");

  const [saving, setSaving] = useState(false);
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
    () => funnels.filter((funnel) => funnel.status === "published").length,
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

  function resetForm() {
    setName("");
    setSlug("");
    setGoal("");
    setDescription("");
    setStatus("draft");
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
      setSuccess("Funnels refreshed.");
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
            sort_order: template.sort_order,
            status: funnel.status === "published" ? "published" : "draft",
            seo_title: `${template.title} | ${funnel.name}`,
            seo_description:
              funnel.description ||
              `${template.title} for ${funnel.name} by ${business.name}.`,
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
    const nextStatus = funnel.status === "published" ? "draft" : "published";

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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Funnels</p>
          <p className="mt-2 text-3xl font-black">{funnels.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Published</p>
          <p className="mt-2 text-3xl font-black">{publishedCount}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Funnel Pages</p>
          <p className="mt-2 text-3xl font-black">{totalPages}</p>
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
        </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">Funnels</h2>
              <p className="text-sm text-zinc-500">
                Manage funnel flows, pages, status, and public previews.
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

                return (
                  <div
                    key={funnel.id}
                    className="rounded-3xl border border-white/10 bg-black/40 p-5"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-xl font-black">{funnel.name}</h3>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                            {funnel.status}
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
                                      {page.type}
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
                              landing, checkout, upsell, and thank-you steps.
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
                          {funnel.status === "published"
                            ? "Draft"
                            : "Publish"}
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