import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  CreditCard,
  ExternalLink,
  Globe,
  KeyRound,
  Lock,
  Palette,
  Settings,
  Shield,
  Sparkles,
  Store,
  UserCog,
  Zap,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import BusinessSettingsClient from "./client";
import BusinessOptimizerButton from "@/components/BusinessOptimizerButton";

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
  slug: string | null;
  tagline: string | null;
  industry: string | null;
  audience: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  status: string | null;
};

type CountResult = {
  count: number | null;
};

async function loadBusinessSettings(id: string) {
  const [
    businessResult,
    productsResult,
    agentsResult,
    automationsResult,
    installedAppsResult,
    leadsResult,
  ] = await Promise.all([
    supabaseAdmin.from("businesses").select("*").eq("id", id).single(),

    supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("ai_agents")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("installed_apps")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (productsResult.error) throw productsResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (automationsResult.error) throw automationsResult.error;
  if (installedAppsResult.error) throw installedAppsResult.error;
  if (leadsResult.error) throw leadsResult.error;

  return {
    business: businessResult.data as Business,
    counts: {
      products: (productsResult as CountResult).count ?? 0,
      aiAgents: (agentsResult as CountResult).count ?? 0,
      automations: (automationsResult as CountResult).count ?? 0,
      installedApps: (installedAppsResult as CountResult).count ?? 0,
      leads: (leadsResult as CountResult).count ?? 0,
    },
  };
}

const sections = [
  {
    title: "Business Information",
    description:
      "Update business name, description, industry, audience, and public slug.",
    icon: Building2,
    href: "#business-info",
  },
  {
    title: "Storefront Settings",
    description:
      "Manage headline, subheadline, storefront visibility, and public storefront link.",
    icon: Store,
    href: "#storefront-settings",
  },
  {
    title: "Brand Settings",
    description: "Control logo, colors, fonts, style, and visual identity.",
    icon: Palette,
    href: "#brand-settings",
  },
  {
    title: "Payments",
    description: "Manage Stripe checkout, payout setup, taxes, and billing options.",
    icon: CreditCard,
    href: "#payments",
  },
  {
    title: "AI Employees",
    description:
      "Manage AI staff, instructions, knowledge, and customer-facing behavior.",
    icon: Bot,
    href: "#ai-settings",
  },
  {
    title: "Notifications",
    description:
      "Configure email, SMS, lead alerts, checkout alerts, and system updates.",
    icon: Bell,
    href: "#notifications",
  },
  {
    title: "Roles & Permissions",
    description: "Invite teammates and control who can manage this business.",
    icon: UserCog,
    href: "#permissions",
  },
  {
    title: "Security",
    description: "Manage access, API keys, webhook security, and account protection.",
    icon: Shield,
    href: "#security",
  },
];

export default async function SettingsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadBusinessSettings(id);

  if (!data) {
    notFound();
  }

  const { business, counts } = data;

  const storefrontHref = business.slug
    ? `/storefront/${business.slug}`
    : `/dashboard/businesses/${business.id}`;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/businesses/${business.id}`}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Settings className="h-3.5 w-3.5" />
                  Business Settings
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Configure branding, storefront visibility, payments, AI
                  employees, permissions, notifications, and security for this
                  CreatorOS AI business.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={storefrontHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  View Storefront
                  <ExternalLink className="h-4 w-4" />
                </Link>

                <a
                  href="#editable-settings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Edit Settings
                  <Zap className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Settings className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Settings</p>
            <h2 className="mt-2 text-3xl font-black">{sections.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Store className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Products</p>
            <h2 className="mt-2 text-3xl font-black">{counts.products}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">AI Employees</p>
            <h2 className="mt-2 text-3xl font-black">{counts.aiAgents}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Zap className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Automations</p>
            <h2 className="mt-2 text-3xl font-black">{counts.automations}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Shield className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Protection</p>
            <h2 className="mt-2 text-3xl font-black">Secure</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <a
                key={section.title}
                href={section.href}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                  <Icon className="h-5 w-5" />
                </div>

                <h2 className="text-xl font-black">{section.title}</h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {section.description}
                </p>
              </a>
            );
          })}
        </div>

        <div id="editable-settings">
          <BusinessSettingsClient business={business} />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div
            id="brand-settings"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <Palette className="h-7 w-7 text-yellow-200" />
            <h2 className="mt-4 text-xl font-black">Brand Settings</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Logo uploads, brand colors, typography, and storefront theme
              controls can be connected here.
            </p>
          </div>

          <div
            id="payments"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <CreditCard className="h-7 w-7 text-yellow-200" />
            <h2 className="mt-4 text-xl font-black">Payments</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Stripe checkout, webhook health, payouts, taxes, and product
              payment settings connect here.
            </p>
          </div>

          <div
            id="ai-settings"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <Bot className="h-7 w-7 text-yellow-200" />
            <h2 className="mt-4 text-xl font-black">AI Employees</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Manage AI roles, instructions, storefront behavior, and business
              knowledge.
            </p>
          </div>

          <div
            id="notifications"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <Bell className="h-7 w-7 text-yellow-200" />
            <h2 className="mt-4 text-xl font-black">Notifications</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Configure lead alerts, order alerts, AI chat alerts, and system
              notifications.
            </p>
          </div>

          <div
            id="permissions"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <UserCog className="h-7 w-7 text-yellow-200" />
            <h2 className="mt-4 text-xl font-black">Roles & Permissions</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Invite team members and control business access levels.
            </p>
          </div>

          <div
            id="security"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
          >
            <KeyRound className="h-7 w-7 text-yellow-200" />
            <h2 className="mt-4 text-xl font-black">Security</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Manage API keys, webhook secrets, private business settings, and
              access protection.
            </p>
          </div>
        </div>

        <BusinessOptimizerButton businessId={business.id} />

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-500">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 text-yellow-200" />
            <p>
              Settings now save through the CreatorOS AI settings API and the AI
              optimizer can generate a growth report from real business data.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}