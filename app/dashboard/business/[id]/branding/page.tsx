import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Badge,
  Brush,
  FileImage,
  ImageIcon,
  Palette,
  Sparkles,
  Type,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Business = {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id,name,description,industry")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Business;
}

const brandingTools = [
  {
    title: "AI Logo Generator",
    description:
      "Generate premium logos in multiple styles for your business.",
    icon: Badge,
  },
  {
    title: "Brand Color Generator",
    description:
      "Create complete color palettes for websites and products.",
    icon: Palette,
  },
  {
    title: "Typography",
    description:
      "Choose headline and body fonts for your brand.",
    icon: Type,
  },
  {
    title: "Social Media Kit",
    description:
      "Generate profile photos, banners and social graphics.",
    icon: ImageIcon,
  },
  {
    title: "Marketing Graphics",
    description:
      "Generate flyers, advertisements and promotional graphics.",
    icon: Brush,
  },
  {
    title: "Media Kit",
    description:
      "Automatically build a professional brand media kit.",
    icon: FileImage,
  },
];

export default async function BrandingStudio({
  params,
}: Props) {
  const { id } = await params;

  const business = await loadBusiness(id);

  if (!business) {
    notFound();
  }

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
            AI Brand Studio
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-8 text-zinc-300">
            Build an entire premium brand with AI. Logos, colors,
            typography, graphics, social media kits, pitch decks,
            business cards and marketing assets.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">

            <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black flex items-center gap-2">
              <Sparkles size={18} />
              Generate Brand
            </button>

            <button className="rounded-2xl border border-white/10 px-6 py-3">
              Save Brand Kit
            </button>

          </div>

        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <Palette className="mb-4 text-yellow-400" />

            <p className="text-sm text-zinc-400">
              Brand Assets
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <ImageIcon className="mb-4 text-yellow-400" />

            <p className="text-sm text-zinc-400">
              Graphics
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <Badge className="mb-4 text-yellow-400" />

            <p className="text-sm text-zinc-400">
              Logos
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>

          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">

            <div className="mb-6 flex items-center gap-3">

              <Sparkles className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                AI Brand Tools
              </h2>

            </div>

            <div className="grid gap-4 md:grid-cols-2">

              {brandingTools.map((tool) => {
                const Icon = tool.icon;

                return (

                  <button
                    key={tool.title}
                    className="rounded-3xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-yellow-400"
                  >

                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">

                      <Icon size={22} />

                    </div>

                    <h3 className="text-lg font-bold">
                      {tool.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {tool.description}
                    </p>

                  </button>

                );
              })}

            </div>

          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">

            <h2 className="text-2xl font-bold">
              Brand Summary
            </h2>

            <div className="mt-5 space-y-4">

              <div>

                <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">
                  Business
                </p>

                <p className="mt-2 text-lg font-semibold">
                  {business.name}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">
                  Industry
                </p>

                <p className="mt-2">
                  {business.industry || "Not set"}
                </p>

              </div>

              <div>

                <p className="text-xs uppercase tracking-[0.3em] text-yellow-400">
                  Description
                </p>

                <p className="mt-2 leading-7 text-zinc-300">
                  {business.description || "No description yet."}
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>
    </main>
  );
}