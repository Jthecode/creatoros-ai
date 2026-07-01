"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  Building2,
  CheckCircle2,
  Globe,
  Loader2,
  Palette,
  Save,
  Sparkles,
} from "lucide-react";

type BusinessSettingsFormProps = {
  business: {
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
  };
};

type SavePayload = {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  industry: string;
  audience: string;
  storefront_headline: string;
  storefront_subheadline: string;
  status: string;
  brand_primary_color: string;
  brand_accent_color: string;
  ai_default_tone: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function BusinessSettingsForm({
  business,
}: BusinessSettingsFormProps) {
  const [name, setName] = useState(business.name ?? "");
  const [slug, setSlug] = useState(business.slug ?? "");
  const [tagline, setTagline] = useState(business.tagline ?? "");
  const [description, setDescription] = useState(business.description ?? "");
  const [industry, setIndustry] = useState(business.industry ?? "");
  const [audience, setAudience] = useState(business.audience ?? "");
  const [storefrontHeadline, setStorefrontHeadline] = useState(
    business.storefront_headline ?? ""
  );
  const [storefrontSubheadline, setStorefrontSubheadline] = useState(
    business.storefront_subheadline ?? ""
  );
  const [status, setStatus] = useState(business.status ?? "draft");

  const [brandPrimaryColor, setBrandPrimaryColor] = useState("#facc15");
  const [brandAccentColor, setBrandAccentColor] = useState("#ffffff");
  const [aiDefaultTone, setAiDefaultTone] = useState("professional");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const storefrontUrl = useMemo(() => {
    const cleanSlug = slugify(slug || name || business.id);
    return `/storefront/${cleanSlug}`;
  }, [slug, name, business.id]);

  function autoGenerateSlug() {
    setSlug(slugify(name));
  }

  async function saveSettings() {
    if (!name.trim()) {
      setError("Business name is required.");
      return;
    }

    const payload: SavePayload = {
      name: name.trim(),
      slug: slugify(slug || name),
      tagline: tagline.trim(),
      description: description.trim(),
      industry: industry.trim(),
      audience: audience.trim(),
      storefront_headline: storefrontHeadline.trim(),
      storefront_subheadline: storefrontSubheadline.trim(),
      status,
      brand_primary_color: brandPrimaryColor,
      brand_accent_color: brandAccentColor,
      ai_default_tone: aiDefaultTone,
    };

    try {
      setSaving(true);
      setSaved(false);
      setError("");

      const res = await fetch(`/api/businesses/${business.id}/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save settings.");
      }

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 2200);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save settings."
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
            Settings saved successfully.
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <Building2 className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black">Business Info</h2>
            <p className="text-sm text-zinc-500">
              Update public business details.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Business name"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <div className="flex gap-2">
            <input
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="business-slug"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />

            <button
              type="button"
              onClick={autoGenerateSlug}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
            >
              Auto
            </button>
          </div>

          <input
            value={tagline}
            onChange={(event) => setTagline(event.target.value)}
            placeholder="Tagline"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            placeholder="Industry"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={audience}
            onChange={(event) => setAudience(event.target.value)}
            placeholder="Target audience"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:col-span-2"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Business description"
            rows={4}
            className="resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:col-span-2"
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <Globe className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black">Storefront</h2>
            <p className="text-sm text-zinc-500">
              Control public storefront headline and visibility.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <p className="text-xs font-bold text-yellow-100/70">
              Public Storefront URL
            </p>
            <p className="mt-2 break-all font-mono text-sm text-yellow-200">
              {storefrontUrl}
            </p>
          </div>

          <input
            value={storefrontHeadline}
            onChange={(event) => setStorefrontHeadline(event.target.value)}
            placeholder="Storefront headline"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <textarea
            value={storefrontSubheadline}
            onChange={(event) => setStorefrontSubheadline(event.target.value)}
            placeholder="Storefront subheadline"
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="published">Published</option>
            <option value="paused">Paused</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <Palette className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black">Brand Defaults</h2>
              <p className="text-sm text-zinc-500">
                Save brand color preferences.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-bold text-zinc-500">
                Primary Color
              </span>
              <input
                type="color"
                value={brandPrimaryColor}
                onChange={(event) => setBrandPrimaryColor(event.target.value)}
                className="h-12 w-full cursor-pointer rounded-2xl border border-white/10 bg-black/40 p-1"
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-bold text-zinc-500">
                Accent Color
              </span>
              <input
                type="color"
                value={brandAccentColor}
                onChange={(event) => setBrandAccentColor(event.target.value)}
                className="h-12 w-full cursor-pointer rounded-2xl border border-white/10 bg-black/40 p-1"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black">AI Defaults</h2>
              <p className="text-sm text-zinc-500">
                Set default AI tone for this business.
              </p>
            </div>
          </div>

          <select
            value={aiDefaultTone}
            onChange={(event) => setAiDefaultTone(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="luxury">Luxury</option>
            <option value="direct">Direct</option>
            <option value="playful">Playful</option>
            <option value="premium">Premium</option>
          </select>

          <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-4 w-4 text-yellow-200" />
              <p className="text-sm leading-6 text-yellow-100/75">
                This can be used later by AI employees, storefront chat,
                marketing generators, product writers, and business optimizer.
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={saveSettings}
        disabled={saving}
        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        {saving ? "Saving Settings..." : "Save Business Settings"}
      </button>
    </div>
  );
}