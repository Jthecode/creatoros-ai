import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Globe,
  Mail,
  MessageSquare,
  Music2,
  Plug,
  ShoppingCart,
  Sparkles,
  Video,
  Wallet,
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
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id,name")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Business;
}

const apps = [
  {
    name: "Stripe",
    description: "Accept payments, subscriptions and invoices.",
    icon: CreditCard,
    status: "Available",
  },
  {
    name: "OpenAI",
    description: "Power AI employees and content generation.",
    icon: Sparkles,
    status: "Connected",
  },
  {
    name: "Google Workspace",
    description: "Connect Gmail, Drive and Calendar.",
    icon: Mail,
    status: "Available",
  },
  {
    name: "Meta",
    description: "Instagram, Facebook Ads and Messenger.",
    icon: MessageSquare,
    status: "Available",
  },
  {
    name: "TikTok",
    description: "Publish content and run advertising campaigns.",
    icon: Video,
    status: "Available",
  },
  {
    name: "YouTube",
    description: "Manage channels and publish videos.",
    icon: Video,
    status: "Available",
  },
  {
    name: "Spotify",
    description: "Artist tools and music analytics.",
    icon: Music2,
    status: "Available",
  },
  {
    name: "Shopify",
    description: "Sync products and customer orders.",
    icon: ShoppingCart,
    status: "Available",
  },
  {
    name: "PayPal",
    description: "Accept PayPal payments worldwide.",
    icon: Wallet,
    status: "Available",
  },
  {
    name: "Zapier",
    description: "Connect thousands of third-party apps.",
    icon: Plug,
    status: "Available",
  },
  {
    name: "Custom Domain",
    description: "Connect your own website domain.",
    icon: Globe,
    status: "Available",
  },
];

export default async function AppsPage({
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
            CreatorOS AI Marketplace
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            Apps & Integrations
          </h1>

          <p className="mt-5 max-w-3xl leading-8 text-zinc-300">
            Install powerful integrations that expand your business.
            Connect payments, marketing, AI, analytics,
            social media, email and automation tools.
          </p>

        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <Plug className="mb-4 text-yellow-400" />

            <p className="text-sm text-zinc-400">
              Available Apps
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              {apps.length}
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <CheckCircle2 className="mb-4 text-yellow-400" />

            <p className="text-sm text-zinc-400">
              Connected
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              1
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <Sparkles className="mb-4 text-yellow-400" />

            <p className="text-sm text-zinc-400">
              AI Extensions
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Ready
            </h2>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <Globe className="mb-4 text-yellow-400" />

            <p className="text-sm text-zinc-400">
              Marketplace
            </p>

            <h2 className="mt-2 text-3xl font-bold">
              Live
            </h2>

          </div>

        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">

          {apps.map((app) => {

            const Icon = app.icon;

            return (

              <div
                key={app.name}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >

                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">

                  <Icon size={28} />

                </div>

                <h2 className="text-2xl font-bold">
                  {app.name}
                </h2>

                <p className="mt-3 leading-7 text-zinc-400">
                  {app.description}
                </p>

                <div className="mt-6 flex items-center justify-between">

                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                    {app.status}
                  </span>

                  <button className="rounded-xl bg-yellow-400 px-5 py-2 font-bold text-black transition hover:bg-yellow-300">

                    Install

                  </button>

                </div>

              </div>

            );

          })}

        </div>

      </section>
    </main>
  );
}