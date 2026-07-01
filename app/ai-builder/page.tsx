"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
import type { GeneratedBusiness } from "@/types/database";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Loader2,
  Sparkles,
} from "lucide-react";

type SavedBusiness = {
  id: string;
  slug: string;
};

export default function AIBuilderPage() {
  const [businessIdea, setBusinessIdea] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [generatedBusiness, setGeneratedBusiness] =
    useState<GeneratedBusiness | null>(null);

  const [savedBusiness, setSavedBusiness] = useState<SavedBusiness | null>(
    null
  );

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleGenerate() {
    setError("");
    setSuccess("");
    setGeneratedBusiness(null);
    setSavedBusiness(null);

    if (!businessIdea.trim()) {
      setError("Please enter a business idea first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/ai/business-builder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessIdea,
          industry,
          audience,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate business.");
      }

      setGeneratedBusiness(data.generatedBusiness);
      setSuccess("Business generated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while generating your business."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveBusiness() {
    setError("");
    setSuccess("");

    if (!generatedBusiness) {
      setError("Generate a business before saving.");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("You must be logged in to save this business.");
      }

      const businessResponse = await fetch("/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          name: generatedBusiness.businessName,
          tagline: generatedBusiness.tagline,
          description: generatedBusiness.description,
          industry: generatedBusiness.industry,
          audience: generatedBusiness.audience,
          brandVoice: generatedBusiness.brandVoice,
          storefrontHeadline: generatedBusiness.storefrontHeadline,
          storefrontSubheadline: generatedBusiness.storefrontSubheadline,
          generatedData: generatedBusiness,
        }),
      });

      const businessData = await businessResponse.json();

      if (!businessResponse.ok) {
        throw new Error(businessData.error || "Unable to save business.");
      }

      const businessId = businessData.business.id;
      const businessSlug = businessData.business.slug;

      const productsResponse = await fetch("/api/products/bulk-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          products: generatedBusiness.products,
        }),
      });

      const productsData = await productsResponse.json();

      if (!productsResponse.ok) {
        throw new Error(productsData.error || "Business saved, but products failed.");
      }

      const agentResponse = await fetch("/api/ai-agents/create-from-business", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
        }),
      });

      const agentData = await agentResponse.json();

      if (!agentResponse.ok) {
        throw new Error(agentData.error || "Business saved, but AI employee failed.");
      }

      setSavedBusiness({
        id: businessId,
        slug: businessSlug,
      });

      setSuccess("Business, products, and AI employee saved successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your business."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.35em] text-yellow-400">
            AI Business Builder
          </p>

          <h1 className="text-4xl font-bold md:text-6xl">
            Build your creator business with AI.
          </h1>

          <p className="mt-5 text-zinc-400">
            Tell CreatorOS AI what you want to launch. We will turn your idea
            into a business profile, storefront, products, AI employee, and
            launch checklist.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-6xl gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                <Sparkles size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">Launch Details</h2>
                <p className="text-sm text-zinc-400">
                  Enter the basics and CreatorOS AI will build the first
                  version.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  What business are you creating?
                </label>
                <textarea
                  value={businessIdea}
                  onChange={(event) => setBusinessIdea(event.target.value)}
                  placeholder="Example: I want to sell music promotion packages to independent artists."
                  className="min-h-32 w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/70"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Industry
                </label>
                <input
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                  placeholder="Music, fitness, real estate, coaching, marketing..."
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/70"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Target audience
                </label>
                <input
                  value={audience}
                  onChange={(event) => setAudience(event.target.value)}
                  placeholder="Example: independent artists, creators, realtors, small businesses..."
                  className="w-full rounded-2xl border border-white/10 bg-black/60 px-4 py-3 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/70"
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-2xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300">
                  {success}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading || saving || !businessIdea.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Generating Business
                  </>
                ) : (
                  <>
                    Generate Business
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {generatedBusiness && (
                <button
                  onClick={handleSaveBusiness}
                  disabled={saving || Boolean(savedBusiness)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-yellow-400/40 px-6 py-4 font-bold text-yellow-400 transition hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Saving Everything
                    </>
                  ) : (
                    <>
                      Save Business, Products & AI Employee
                      <CheckCircle2 size={20} />
                    </>
                  )}
                </button>
              )}

              {savedBusiness && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href={`/storefront/${savedBusiness.slug}`}
                    className="flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 font-bold text-black transition hover:bg-zinc-200"
                  >
                    View Storefront
                  </Link>

                  <Link
                    href={`/dashboard/business/${savedBusiness.id}`}
                    className="flex w-full items-center justify-center rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300"
                  >
                    Business Dashboard
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-yellow-400">
                <Bot size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold">AI Output Preview</h2>
                <p className="text-sm text-zinc-300">
                  Your generated creator business appears here.
                </p>
              </div>
            </div>

            {!generatedBusiness ? (
              <>
                <div className="space-y-4">
                  {[
                    "Business name and brand direction",
                    "Storefront homepage copy",
                    "Product and pricing ideas",
                    "FAQ and refund policy",
                    "AI sales employee instructions",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/50 p-4"
                    >
                      <CheckCircle2 className="text-yellow-400" size={20} />
                      <span className="text-sm text-zinc-200">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-white/10 bg-black/50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <BriefcaseBusiness className="text-yellow-400" size={20} />
                    <h3 className="font-bold">CreatorOS AI Plan</h3>
                  </div>

                  <p className="text-sm leading-6 text-zinc-300">
                    Enter a business idea, generate the business, then save it
                    to your CreatorOS AI account.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
                    Business
                  </p>
                  <h3 className="mt-3 text-2xl font-bold">
                    {generatedBusiness.businessName}
                  </h3>
                  <p className="mt-2 text-sm text-yellow-300">
                    {generatedBusiness.tagline}
                  </p>
                  <p className="mt-4 text-sm leading-6 text-zinc-300">
                    {generatedBusiness.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
                    Storefront
                  </p>
                  <h3 className="mt-3 text-xl font-bold">
                    {generatedBusiness.storefrontHeadline}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {generatedBusiness.storefrontSubheadline}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
                    Products
                  </p>

                  <div className="mt-4 space-y-3">
                    {generatedBusiness.products?.map((product) => (
                      <div
                        key={product.name}
                        className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <h4 className="font-bold">{product.name}</h4>
                          <span className="text-sm font-bold text-yellow-400">
                            {product.price}
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {product.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
                    AI Employee
                  </p>

                  <h3 className="mt-3 text-xl font-bold">
                    {generatedBusiness.aiEmployee.name} —{" "}
                    {generatedBusiness.aiEmployee.role}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-300">
                    {generatedBusiness.aiEmployee.openingMessage}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/50 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-yellow-400">
                    Launch Checklist
                  </p>

                  <div className="mt-4 space-y-3">
                    {generatedBusiness.checklist?.map((item, index) => (
                      <div
                        key={`${item}-${index}`}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-400/10 text-sm text-yellow-400">
                          {index + 1}
                        </span>
                        <span className="text-sm text-zinc-300">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}