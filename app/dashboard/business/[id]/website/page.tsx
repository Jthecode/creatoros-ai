import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  Globe,
  Layout,
  RefreshCw,
  Save,
  Sparkles,
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
  slug: string;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  description: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as Business;
}

const pages = [
  "Home",
  "About",
  "Services",
  "Products",
  "Pricing",
  "Testimonials",
  "FAQ",
  "Contact",
  "Privacy Policy",
  "Terms",
];

export default async function WebsiteBuilder({
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
          className="mb-8 inline-flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={18} />
          Back to Business
        </Link>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8">

          <p className="uppercase tracking-[0.35em] text-sm text-yellow-400">
            AI Website Builder
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            {business.name}
          </h1>

          <p className="mt-5 max-w-3xl text-zinc-300">
            Generate, edit, and publish an entire AI-powered website.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">

            <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black flex items-center gap-2">
              <Sparkles size={18} />
              Generate Website
            </button>

            <button className="rounded-2xl border border-white/10 px-6 py-3 flex items-center gap-2">
              <RefreshCw size={18} />
              Regenerate
            </button>

            <button className="rounded-2xl border border-white/10 px-6 py-3 flex items-center gap-2">
              <Save size={18} />
              Save Website
            </button>

            <Link
              href={`/storefront/${business.slug}`}
              className="rounded-2xl border border-white/10 px-6 py-3 flex items-center gap-2"
            >
              <Eye size={18} />
              Preview
            </Link>

          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-5 flex items-center gap-3">

              <Layout className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                Website Pages
              </h2>

            </div>

            <div className="space-y-3">

              {pages.map((page) => (

                <button
                  key={page}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-yellow-400"
                >
                  {page}

                  <Sparkles
                    size={18}
                    className="text-yellow-400"
                  />

                </button>

              ))}

            </div>

          </div>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-6 flex items-center gap-3">

              <Globe className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                Live Website Preview
              </h2>

            </div>

            <div className="rounded-3xl bg-black p-10">

              <p className="text-yellow-400 uppercase tracking-[0.3em]">
                AI Website
              </p>

              <h1 className="mt-4 text-5xl font-bold">
                {business.storefront_headline || business.name}
              </h1>

              <p className="mt-6 max-w-3xl leading-8 text-zinc-300">
                {business.storefront_subheadline ||
                  business.description}
              </p>

              <div className="mt-10 grid gap-6 md:grid-cols-3">

                <div className="rounded-2xl border border-white/10 p-6">
                  Home Page
                </div>

                <div className="rounded-2xl border border-white/10 p-6">
                  Products
                </div>

                <div className="rounded-2xl border border-white/10 p-6">
                  AI Employee
                </div>

                <div className="rounded-2xl border border-white/10 p-6">
                  FAQ
                </div>

                <div className="rounded-2xl border border-white/10 p-6">
                  Contact
                </div>

                <div className="rounded-2xl border border-white/10 p-6">
                  About
                </div>

              </div>

            </div>

          </div>

        </div>

      </section>
    </main>
  );
}