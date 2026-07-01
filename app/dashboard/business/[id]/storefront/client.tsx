"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Eye,
  Globe,
  Loader2,
  MessageCircle,
  Save,
  Settings,
  Sparkles,
  Store,
} from "lucide-react";

type Business = {
  id: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  status: string | null;
  generated_data?: Record<string, unknown> | null;
};

type Props = {
  business: Business;
};

type StorefrontForm = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  audience: string;
  storefront_headline: string;
  storefront_subheadline: string;
  status: string;
  ai_chat_enabled: boolean;
  lead_form_enabled: boolean;
  products_enabled: boolean;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getGeneratedSettings(business: Business) {
  const data = business.generated_data;

  if (!data || typeof data !== "object") {
    return {
      ai_chat_enabled: true,
      lead_form_enabled: true,
      products_enabled: true,
    };
  }

  return {
    ai_chat_enabled:
      typeof data.ai_chat_enabled === "boolean" ? data.ai_chat_enabled : true,
    lead_form_enabled:
      typeof data.lead_form_enabled === "boolean"
        ? data.lead_form_enabled
        : true,
    products_enabled:
      typeof data.products_enabled === "boolean" ? data.products_enabled : true,
  };
}

export default function StorefrontClient({ business }: Props) {
  const generatedSettings = useMemo(
    () => getGeneratedSettings(business),
    [business]
  );

  const [form, setForm] = useState<StorefrontForm>({
    name: business.name ?? "",
    slug: business.slug ?? "",
    tagline: business.tagline ?? "",
    description: business.description ?? "",
    industry: business.industry ?? "",
    audience: business.audience ?? "",
    storefront_headline: business.storefront_headline ?? "",
    storefront_subheadline: business.storefront_subheadline ?? "",
    status: business.status ?? "active",
    ai_chat_enabled: generatedSettings.ai_chat_enabled,
    lead_form_enabled: generatedSettings.lead_form_enabled,
    products_enabled: generatedSettings.products_enabled,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const previewHref = form.slug
    ? `/storefront/${form.slug}`
    : `/dashboard/business/${business.id}/storefront`;

  function updateForm<K extends keyof StorefrontForm>(
    key: K,
    value: StorefrontForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
    setError("");
  }

  function autoGenerateSlug() {
    updateForm("slug", slugify(form.name || business.name || "storefront"));
  }

  async function saveStorefront(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Business name is required.");
      return;
    }

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const previousGeneratedData =
        business.generated_data && typeof business.generated_data === "object"
          ? business.generated_data
          : {};

      const res = await fetch("/api/businesses", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: business.id,
          name: form.name.trim(),
          slug: slugify(form.slug || form.name),
          tagline: form.tagline.trim() || null,
          description: form.description.trim() || null,
          industry: form.industry.trim() || null,
          audience: form.audience.trim() || null,
          storefront_headline:
            form.storefront_headline.trim() || form.name.trim(),
          storefront_subheadline:
            form.storefront_subheadline.trim() ||
            form.description.trim() ||
            null,
          status: form.status || "active",
          generated_data: {
            ...previousGeneratedData,
            ai_chat_enabled: form.ai_chat_enabled,
            lead_form_enabled: form.lead_form_enabled,
            products_enabled: form.products_enabled,
            storefrontSettingsUpdatedAt: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save storefront settings.");
      }

      setForm((current) => ({
        ...current,
        slug: slugify(current.slug || current.name),
      }));

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1800);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save storefront settings."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      {saved ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Storefront settings saved.
          </div>
        </div>
      ) : null}

      <form
        onSubmit={saveStorefront}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
      >
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <Store className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black">Edit Storefront</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Update the public storefront copy, URL, visibility, products,
                AI chat, and lead capture settings.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
            >
              <Eye className="h-4 w-4" />
              Preview
            </a>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Storefront"}
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Business Name
            </label>
            <input
              value={form.name}
              onChange={(event) => updateForm("name", event.target.value)}
              placeholder="Business name"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Storefront Slug
            </label>

            <div className="flex gap-2">
              <input
                value={form.slug}
                onChange={(event) =>
                  updateForm("slug", slugify(event.target.value))
                }
                placeholder="my-storefront"
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <button
                type="button"
                onClick={autoGenerateSlug}
                className="shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200"
              >
                Auto
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Public URL: /storefront/{form.slug || "your-slug"}
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Tagline
            </label>
            <input
              value={form.tagline}
              onChange={(event) => updateForm("tagline", event.target.value)}
              placeholder="Short brand tagline"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Status
            </label>
            <select
              value={form.status}
              onChange={(event) => updateForm("status", event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
            >
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Industry
            </label>
            <input
              value={form.industry}
              onChange={(event) => updateForm("industry", event.target.value)}
              placeholder="Fitness, music, coaching, ecommerce..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Audience
            </label>
            <input
              value={form.audience}
              onChange={(event) => updateForm("audience", event.target.value)}
              placeholder="Who this storefront serves"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Business Description
            </label>
            <textarea
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              placeholder="Describe the business"
              rows={4}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Storefront Headline
            </label>
            <input
              value={form.storefront_headline}
              onChange={(event) =>
                updateForm("storefront_headline", event.target.value)
              }
              placeholder="Main storefront headline"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              Storefront Subheadline
            </label>
            <textarea
              value={form.storefront_subheadline}
              onChange={(event) =>
                updateForm("storefront_subheadline", event.target.value)
              }
              placeholder="Supporting sales message under the headline"
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <button
            type="button"
            onClick={() =>
              updateForm("products_enabled", !form.products_enabled)
            }
            className={
              form.products_enabled
                ? "rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-left text-emerald-300"
                : "rounded-3xl border border-white/10 bg-black/40 p-5 text-left text-zinc-400"
            }
          >
            <Globe className="mb-4 h-6 w-6" />
            <h3 className="font-black">Products Section</h3>
            <p className="mt-2 text-sm leading-6 opacity-80">
              Show or hide storefront products.
            </p>
            <p className="mt-4 text-xs font-bold">
              {form.products_enabled ? "Enabled" : "Disabled"}
            </p>
          </button>

          <button
            type="button"
            onClick={() => updateForm("ai_chat_enabled", !form.ai_chat_enabled)}
            className={
              form.ai_chat_enabled
                ? "rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-left text-emerald-300"
                : "rounded-3xl border border-white/10 bg-black/40 p-5 text-left text-zinc-400"
            }
          >
            <Bot className="mb-4 h-6 w-6" />
            <h3 className="font-black">AI Chat</h3>
            <p className="mt-2 text-sm leading-6 opacity-80">
              Let visitors talk to the AI employee.
            </p>
            <p className="mt-4 text-xs font-bold">
              {form.ai_chat_enabled ? "Enabled" : "Disabled"}
            </p>
          </button>

          <button
            type="button"
            onClick={() =>
              updateForm("lead_form_enabled", !form.lead_form_enabled)
            }
            className={
              form.lead_form_enabled
                ? "rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-left text-emerald-300"
                : "rounded-3xl border border-white/10 bg-black/40 p-5 text-left text-zinc-400"
            }
          >
            <MessageCircle className="mb-4 h-6 w-6" />
            <h3 className="font-black">Lead Form</h3>
            <p className="mt-2 text-sm leading-6 opacity-80">
              Capture visitor info and sales requests.
            </p>
            <p className="mt-4 text-xs font-bold">
              {form.lead_form_enabled ? "Enabled" : "Disabled"}
            </p>
          </button>
        </div>
      </form>

      <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
            <Settings className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black text-yellow-100">
              Storefront Controls Connected
            </h2>

            <p className="mt-2 text-sm leading-7 text-yellow-100/75">
              This client saves storefront copy and toggle settings back into
              the businesses table through your existing businesses API.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}