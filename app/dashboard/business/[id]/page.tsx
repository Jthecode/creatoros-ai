import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Command,
  DollarSign,
  FileText,
  Globe,
  Megaphone,
  Package,
  Pencil,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import MobileBusinessNav from "@/components/MobileBusinessNav";

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
  tagline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
  brand_voice: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  status: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  status: string | null;
};

type AgentRow = {
  id: string;
  name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type OrderRow = {
  id: string;
  total_cents: number | null;
  customer_email: string | null;
  status: string | null;
};

type WebsitePageRow = {
  id: string;
  title: string;
  slug: string;
  status: string | null;
  is_homepage: boolean | null;
};

type DashboardStats = {
  revenue: number;
  products: number;
  agents: number;
  activeAgents: number;
  orders: number;
  customers: number;
  commands: number;
  automations: number;
  websitePages: number;
  publishedPages: number;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function loadBusiness(id: string) {
  const [
    businessResult,
    productsResult,
    agentsResult,
    ordersResult,
    commandRunsResult,
    automationsResult,
    websitePagesResult,
  ] = await Promise.all([
    supabaseAdmin.from("businesses").select("*").eq("id", id).single(),

    supabaseAdmin
      .from("products")
      .select("id, name, description, price_cents, currency, status")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("ai_agents")
      .select("id, name, role, is_active")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("orders")
      .select("id, total_cents, customer_email, status")
      .eq("business_id", id),

    supabaseAdmin
      .from("command_runs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("automations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id),

    supabaseAdmin
      .from("website_pages")
      .select("id, title, slug, status, is_homepage")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) return null;
  if (productsResult.error) throw productsResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (commandRunsResult.error) throw commandRunsResult.error;
  if (automationsResult.error) throw automationsResult.error;
  if (websitePagesResult.error) throw websitePagesResult.error;

  const business = businessResult.data as BusinessRow;
  const products = (productsResult.data ?? []) as ProductRow[];
  const agents = (agentsResult.data ?? []) as AgentRow[];
  const orders = (ordersResult.data ?? []) as OrderRow[];
  const websitePages = (websitePagesResult.data ?? []) as WebsitePageRow[];

  const paidOrders = orders.filter((order) => order.status === "paid");

  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_cents ?? 0),
    0
  );

  const customers = new Set(
    orders.map((order) => order.customer_email).filter(Boolean)
  );

  const stats: DashboardStats = {
    revenue,
    products: products.length,
    agents: agents.length,
    activeAgents: agents.filter((agent) => agent.is_active).length,
    orders: orders.length,
    customers: customers.size,
    commands: commandRunsResult.count ?? 0,
    automations: automationsResult.count ?? 0,
    websitePages: websitePages.length,
    publishedPages: websitePages.filter((page) => page.status === "published")
      .length,
  };

  return {
    business,
    products,
    agents,
    orders,
    websitePages,
    stats,
  };
}
export default async function BusinessDashboard({ params }: Props) {
  const { id } = await params;
  const data = await loadBusiness(id);

  if (!data) notFound();

  const { business, products, agents, websitePages, stats } = data;

  const storefrontHref = business.slug
    ? `/storefront/${business.slug}`
    : `/dashboard/business/${business.id}/storefront`;

  const websiteHref = business.slug ? `/site/${business.slug}` : "#";

  const healthItems = [
    {
      label: "Business Profile",
      complete: Boolean(business.name && business.description),
    },
    {
      label: "Storefront",
      complete: Boolean(business.slug),
    },
    {
      label: "Products",
      complete: stats.products > 0,
    },
    {
      label: "AI Employees",
      complete: stats.agents > 0,
    },
    {
      label: "Website Pages",
      complete: stats.websitePages > 0,
    },
    {
      label: "Automations",
      complete: stats.automations > 0,
    },
  ];

  const completedHealth = healthItems.filter((item) => item.complete).length;
  const healthScore = Math.round((completedHealth / healthItems.length) * 100);

  const cards = [
    {
      title: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
    },
    {
      title: "Products",
      value: stats.products.toString(),
      icon: Package,
    },
    {
      title: "AI Employees",
      value: `${stats.activeAgents}/${stats.agents}`,
      icon: Bot,
    },
    {
      title: "AI Commands",
      value: stats.commands.toString(),
      icon: Command,
    },
  ];

  const aiTools = [
    {
      title: "AI Command Center",
      description: "Run your business from one AI command.",
      href: `/dashboard/command-center?businessId=${business.id}`,
      icon: Command,
      featured: true,
    },
    {
      title: "Website Builder",
      description: "Generate and publish a full AI website.",
      href: `/dashboard/business/${business.id}/website`,
      icon: Globe,
      featured: true,
    },
    {
      title: "Generate Products",
      description: "Create offers, packages, and checkout-ready products.",
      href: `/dashboard/business/${business.id}/products`,
      icon: Package,
      featured: false,
    },
    {
      title: "Marketing Center",
      description: "Create campaigns, emails, content, and launch plans.",
      href: `/dashboard/business/${business.id}/marketing`,
      icon: Megaphone,
      featured: false,
    },
    {
      title: "AI Automations",
      description: "Build workflows for leads, orders, and follow-ups.",
      href: `/dashboard/business/${business.id}/automation`,
      icon: Workflow,
      featured: false,
    },
    {
      title: "AI Employees",
      description: "Train sales, support, onboarding, and business agents.",
      href: `/dashboard/business/${business.id}/ai-agents`,
      icon: Bot,
      featured: false,
    },
  ];

  const managementLinks = [
    {
      title: "Products",
      href: `/dashboard/business/${business.id}/products`,
      icon: Package,
    },
    {
      title: "Customers",
      href: `/dashboard/business/${business.id}/crm`,
      icon: Users,
    },
    {
      title: "Website",
      href: `/dashboard/business/${business.id}/website`,
      icon: Globe,
    },
    {
      title: "Automation",
      href: `/dashboard/business/${business.id}/automation`,
      icon: Workflow,
    },
    {
      title: "Settings",
      href: `/dashboard/business/${business.id}/settings`,
      icon: Settings,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] pb-24 text-white lg:pb-0">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <BriefcaseBusiness className="h-3.5 w-3.5" />
                  CreatorOS AI Business
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {business.name}
                </h1>

                <p className="mt-3 text-lg font-bold text-yellow-200">
                  {business.tagline || "AI-powered creator business"}
                </p>

                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-400 sm:text-base">
                  {business.description ||
                    "Manage your storefront, website, products, customers, AI employees, automations, and growth tools from one command center."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {business.industry ? (
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-zinc-300">
                      {business.industry}
                    </span>
                  ) : null}

                  {business.audience ? (
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-zinc-300">
                      {business.audience}
                    </span>
                  ) : null}

                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold capitalize text-zinc-300">
                    {business.status || "draft"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={`/dashboard/command-center?businessId=${business.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Command className="h-4 w-4" />
                  Command Center
                </Link>

                <Link
                  href={websiteHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Globe className="h-4 w-4" />
                  View Website
                </Link>

                <Link
                  href={storefrontHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Storefront
                </Link>

                <Link
                  href={`/dashboard/business/${business.id}/settings`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Business
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
                key={card.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <Icon className="h-7 w-7 text-yellow-200" />
                <p className="mt-4 text-xs text-zinc-500">{card.title}</p>
                <h2 className="mt-2 text-3xl font-black">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-yellow-200" />
              <h2 className="text-2xl font-black text-yellow-100">
                Business Health
              </h2>
            </div>

            <p className="mt-4 text-5xl font-black text-yellow-100">
              {healthScore}%
            </p>

            <p className="mt-2 text-sm leading-6 text-yellow-100/70">
              {completedHealth} of {healthItems.length} launch systems are
              complete.
            </p>

            <div className="mt-5 space-y-3">
              {healthItems.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl border border-yellow-400/20 bg-black/30 px-4 py-3"
                >
                  <span className="text-sm font-bold text-yellow-100/80">
                    {item.label}
                  </span>

                  <span
                    className={
                      item.complete
                        ? "rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                        : "rounded-full bg-white/10 px-3 py-1 text-xs font-black text-zinc-400"
                    }
                  >
                    {item.complete ? "Done" : "Needed"}
                  </span>
                </div>
              ))}
            </div>
          </div>
                    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-yellow-200" />
              <h2 className="text-2xl font-black">AI Business Tools</h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {aiTools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <Link
                    key={tool.title}
                    href={tool.href}
                    className={
                      tool.featured
                        ? "rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/20"
                        : "rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
                    }
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className={
                          tool.featured
                            ? "font-black text-yellow-100"
                            : "font-black text-white"
                        }
                      >
                        {tool.title}
                      </h3>

                      <Icon
                        className={
                          tool.featured
                            ? "h-5 w-5 text-yellow-200"
                            : "h-5 w-5 text-yellow-200"
                        }
                      />
                    </div>

                    <p
                      className={
                        tool.featured
                          ? "mt-3 text-sm leading-6 text-yellow-100/70"
                          : "mt-3 text-sm leading-6 text-zinc-400"
                      }
                    >
                      {tool.description}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:col-span-2">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-yellow-200" />
                <h2 className="text-2xl font-black">Website Builder</h2>
              </div>

              <Link
                href={`/dashboard/business/${business.id}/website`}
                className="inline-flex w-fit items-center gap-2 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200 transition hover:bg-yellow-400/20"
              >
                Open Builder
                <Globe className="h-4 w-4" />
              </Link>
            </div>

            {websitePages.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
                <FileText className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="mt-4 text-xl font-black">No website pages yet</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-zinc-500">
                  Use the AI Website Builder to create your homepage, about
                  page, services page, FAQ, contact page, and SEO-ready website.
                </p>

                <Link
                  href={`/dashboard/business/${business.id}/website`}
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Website
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {websitePages.slice(0, 6).map((page) => (
                  <Link
                    key={page.id}
                    href={`/dashboard/business/${business.id}/website`}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-yellow-400/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{page.title}</h3>
                        <p className="mt-1 font-mono text-xs text-zinc-500">
                          /site/{business.slug || "business"}/{page.slug}
                        </p>
                      </div>

                      {page.is_homepage ? (
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">
                          Home
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-xs font-bold capitalize text-zinc-500">
                      {page.status || "draft"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Settings className="h-5 w-5 text-yellow-200" />
              <h2 className="text-2xl font-black">Business Management</h2>
            </div>

            <div className="space-y-3">
              {managementLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
                  >
                    <span className="font-bold">{item.title}</span>
                    <Icon className="h-5 w-5 text-yellow-200" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Command className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black text-yellow-100">
                AI Command Center
              </h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-yellow-100/75">
              Tell CreatorOS what to build, launch, automate, or improve. The
              AI turns your command into business actions.
            </p>

            <Link
              href={`/dashboard/command-center?businessId=${business.id}`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              Run AI Command
              <Command className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Marketing Center</h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Generate social posts, email campaigns, launch calendars, SEO
              content, ads, and brand messaging.
            </p>

            <Link
              href={`/dashboard/business/${business.id}/marketing`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
            >
              Open Marketing
              <Megaphone className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <Workflow className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Automation Engine</h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Build AI workflows for lead follow-ups, order follow-ups,
              abandoned carts, reports, and customer touchpoints.
            </p>

            <Link
              href={`/dashboard/business/${business.id}/automation`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
            >
              Open Automation
              <Workflow className="h-4 w-4" />
            </Link>
          </div>
        </div>
                <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 text-yellow-200" />
                <h2 className="text-2xl font-black">Products</h2>
              </div>

              <Link
                href={`/dashboard/business/${business.id}/products`}
                className="text-sm font-bold text-yellow-200 hover:text-yellow-100"
              >
                View All
              </Link>
            </div>

            {products.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-center">
                <Package className="mx-auto h-9 w-9 text-zinc-600" />
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  No products saved yet. Use AI Builder, Website Builder, or
                  Command Center to generate products for this business.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">{product.name}</h3>

                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                          {product.description || "No description yet."}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-black text-yellow-200">
                        {formatCurrency(product.price_cents ?? 0)}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                        {product.status || "draft"}
                      </span>

                      <Link
                        href={`/dashboard/business/${business.id}/products`}
                        className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Bot className="h-5 w-5 text-yellow-200" />
                <h2 className="text-2xl font-black">AI Employees</h2>
              </div>

              <Link
                href={`/dashboard/business/${business.id}/ai-agents`}
                className="text-sm font-bold text-yellow-200 hover:text-yellow-100"
              >
                View All
              </Link>
            </div>

            {agents.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/30 p-6 text-center">
                <Bot className="mx-auto h-9 w-9 text-zinc-600" />
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  No AI employees created yet. Your sales, support, onboarding,
                  and marketing AI employees will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-black">
                          {agent.name || "CreatorOS AI Employee"}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-yellow-200">
                          {agent.role || "AI Sales Manager"}
                        </p>
                      </div>

                      <span
                        className={
                          agent.is_active
                            ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                            : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-zinc-400"
                        }
                      >
                        {agent.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <Link
                      href={`/dashboard/business/${business.id}/ai-agents`}
                      className="mt-4 inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200"
                    >
                      Manage AI Employee
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <ShoppingBag className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Orders</h2>
            </div>

            <p className="text-4xl font-black">{stats.orders}</p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Total orders connected to this business.
            </p>

            <Link
              href={`/dashboard/business/${business.id}/orders`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
            >
              View Orders
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Users className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Customers</h2>
            </div>

            <p className="text-4xl font-black">{stats.customers}</p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Unique customers detected from paid or saved orders.
            </p>

            <Link
              href={`/dashboard/business/${business.id}/crm`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
            >
              Open CRM
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Analytics</h2>
            </div>

            <p className="text-4xl font-black">
              {stats.publishedPages}/{stats.websitePages}
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Published website pages compared to total website pages.
            </p>

            <Link
              href={`/dashboard/business/${business.id}/analytics`}
              className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
            >
              View Analytics
            </Link>
          </div>
        </div>
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Activity className="h-5 w-5 text-yellow-200" />
            <h2 className="text-2xl font-black">Next Best Moves</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href={`/dashboard/command-center?businessId=${business.id}`}
              className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/20"
            >
              <Command className="h-6 w-6 text-yellow-200" />
              <h3 className="mt-4 font-black text-yellow-100">
                Run an AI command
              </h3>
              <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                Ask CreatorOS to build, launch, automate, or improve this
                business.
              </p>
            </Link>

            <Link
              href={`/dashboard/business/${business.id}/website`}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
            >
              <Globe className="h-6 w-6 text-yellow-200" />
              <h3 className="mt-4 font-black text-white">
                Publish website pages
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Create a homepage, about page, services page, FAQ, and contact
                page.
              </p>
            </Link>

            <Link
              href={`/dashboard/business/${business.id}/automation`}
              className="rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
            >
              <Workflow className="h-6 w-6 text-yellow-200" />
              <h3 className="mt-4 font-black text-white">
                Add follow-up workflows
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Automate lead follow-up, customer support, reporting, and
                post-purchase messages.
              </p>
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-200">
                <Sparkles className="h-3.5 w-3.5" />
                CreatorOS AI Growth Layer
              </div>

              <h2 className="text-2xl font-black text-yellow-100">
                This business is ready for AI-powered growth.
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-yellow-100/75">
                CreatorOS AI can now connect this business profile, products,
                AI employees, website pages, automations, CRM, orders, and
                marketing tools into one operating system.
              </p>
            </div>

            <Link
              href={`/dashboard/command-center?businessId=${business.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              Open AI Command Center
              <Command className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <MobileBusinessNav businessId={business.id} />
    </main>
  );
}