import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Command,
  DollarSign,
  Eye,
  Globe,
  Package,
  Rocket,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  status: string | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  total_cents: number | null;
  customer_email: string | null;
  status: string | null;
};

type DashboardStats = {
  revenue: number;
  visitors: number;
  customers: number;
  products: number;
  businesses: number;
  aiAgents: number;
  orders: number;
  commands: number;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function getDashboardData() {
  const [
    businessesResult,
    productsResult,
    agentsResult,
    ordersResult,
    commandsResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5),

    supabaseAdmin
      .from("products")
      .select("id", { count: "exact", head: true }),

    supabaseAdmin
      .from("ai_agents")
      .select("id", { count: "exact", head: true }),

    supabaseAdmin.from("orders").select("id, total_cents, customer_email, status"),

    supabaseAdmin
      .from("command_runs")
      .select("id", { count: "exact", head: true }),
  ]);

  if (businessesResult.error) throw businessesResult.error;
  if (productsResult.error) throw productsResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (commandsResult.error) throw commandsResult.error;

  const orders = (ordersResult.data ?? []) as OrderRow[];
  const paidOrders = orders.filter((order) => order.status === "paid");

  const uniqueCustomers = new Set(
    orders.map((order) => order.customer_email).filter(Boolean)
  );

  const stats: DashboardStats = {
    revenue: paidOrders.reduce(
      (sum, order) => sum + Number(order.total_cents ?? 0),
      0
    ),
    visitors: 0,
    customers: uniqueCustomers.size,
    products: productsResult.count ?? 0,
    businesses: businessesResult.data?.length ?? 0,
    aiAgents: agentsResult.count ?? 0,
    orders: orders.length,
    commands: commandsResult.count ?? 0,
  };

  return {
    stats,
    businesses: (businessesResult.data ?? []) as BusinessRow[],
  };
}

const launchSteps = [
  "Create your business profile",
  "Generate your AI storefront",
  "Add your first product or service",
  "Connect payments",
  "Deploy your AI sales employee",
];

export default async function DashboardPage() {
  const { stats, businesses } = await getDashboardData();

  const latestBusiness = businesses[0] ?? null;

  const statCards = [
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
    },
    {
      label: "Customers",
      value: stats.customers.toString(),
      icon: Users,
    },
    {
      label: "Products",
      value: stats.products.toString(),
      icon: Package,
    },
    {
      label: "AI Commands",
      value: stats.commands.toString(),
      icon: Command,
    },
  ];

  const commandCenterHref = latestBusiness
    ? `/dashboard/command-center?businessId=${latestBusiness.id}`
    : "/ai-builder";

  const quickActions = [
    {
      title: "AI Command Center",
      description: latestBusiness
        ? "Run your business from one AI command."
        : "Create a business first to unlock the command center.",
      href: commandCenterHref,
      featured: true,
    },
    {
      title: "Generate Business",
      description: "Use AI to build your first creator business.",
      href: "/ai-builder",
      featured: false,
    },
    {
      title: "Browse Marketplace",
      description: "Install AI modules, tools, templates, and upgrades.",
      href: "/marketplace",
      featured: false,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />

      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Sparkles className="h-3.5 w-3.5" />
                  Creator Command Center
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Welcome to CreatorOS AI
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Build your business, launch your storefront, manage products,
                  track orders, deploy AI employees, and run growth actions from
                  one AI-powered dashboard.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={commandCenterHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Command className="h-4 w-4" />
                  Open Command Center
                </Link>

                <Link
                  href="/ai-builder"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Rocket className="h-4 w-4" />
                  Build With AI
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <Icon className="h-7 w-7 text-yellow-200" />
                <p className="mt-4 text-xs text-zinc-500">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-black">{stat.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">AI Launch Checklist</h2>
                <p className="text-sm text-zinc-400">
                  Complete these steps to launch your first AI-powered business.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {launchSteps.map((item, index) => {
                const completed =
                  (index === 0 && stats.businesses > 0) ||
                  (index === 1 && stats.businesses > 0) ||
                  (index === 2 && stats.products > 0) ||
                  (index === 3 && stats.orders > 0) ||
                  (index === 4 && stats.aiAgents > 0);

                return (
                  <div
                    key={item}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-black text-yellow-200">
                        {index + 1}
                      </span>

                      <p className="font-bold">{item}</p>
                    </div>

                    <span
                      className={
                        completed
                          ? "inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"
                          : "inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-400"
                      }
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {completed ? "Complete" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
              <Bot className="h-6 w-6" />
            </div>

            <h2 className="text-2xl font-black text-yellow-100">
              AI Workforce
            </h2>

            <p className="mt-3 text-sm leading-6 text-yellow-100/75">
              You currently have{" "}
              <span className="font-black text-yellow-200">
                {stats.aiAgents}
              </span>{" "}
              AI employee{stats.aiAgents === 1 ? "" : "s"} connected to your
              creator businesses.
            </p>

            <Link
              href={latestBusiness ? `/dashboard/business/${latestBusiness.id}/ai-agents` : "/ai-builder"}
              className="mt-6 inline-flex rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              Manage AI Employees
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Recent Businesses</h2>
            </div>

            {businesses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
                <BriefcaseBusiness className="mx-auto h-10 w-10 text-zinc-600" />
                <p className="mt-4 text-sm leading-6 text-zinc-400">
                  No businesses saved yet. Generate your first business with AI
                  to see it appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {businesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link
                        href={`/dashboard/business/${business.id}`}
                        className="font-black text-white hover:text-yellow-200"
                      >
                        {business.name}
                      </Link>

                      <p className="mt-1 text-sm text-zinc-500">
                        {business.slug
                          ? `/storefront/${business.slug}`
                          : "No storefront slug yet"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                        {business.status ?? "draft"}
                      </span>

                      {business.slug ? (
                        <Link
                          href={`/storefront/${business.slug}`}
                          className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200 hover:bg-yellow-400/20"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Storefront
                        </Link>
                      ) : null}

                      <Link
                        href={`/dashboard/command-center?businessId=${business.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200 hover:bg-yellow-400/20"
                      >
                        <Command className="h-3.5 w-3.5" />
                        Command
                      </Link>

                      <Link
                        href={`/dashboard/business/${business.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-300 hover:border-yellow-400/50"
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
            <div className="mb-5 flex items-center gap-3">
              <BriefcaseBusiness className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Quick Actions</h2>
            </div>

            <div className="grid gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className={
                    action.featured
                      ? "rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/20"
                      : "rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-yellow-400/40"
                  }
                >
                  <h3
                    className={
                      action.featured
                        ? "font-black text-yellow-100"
                        : "font-black text-white"
                    }
                  >
                    {action.title}
                  </h3>

                  <p
                    className={
                      action.featured
                        ? "mt-2 text-sm leading-6 text-yellow-100/70"
                        : "mt-2 text-sm leading-6 text-zinc-400"
                    }
                  >
                    {action.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}