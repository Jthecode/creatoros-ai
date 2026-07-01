import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  DollarSign,
  Eye,
  Globe,
  Package,
  Sparkles,
  Users,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
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
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function getDashboardData() {
  const [businessesResult, productsResult, agentsResult, ordersResult] =
    await Promise.all([
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
      supabaseAdmin
        .from("orders")
        .select("id, total_cents, customer_email, status"),
    ]);

  if (businessesResult.error) throw businessesResult.error;
  if (productsResult.error) throw productsResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (ordersResult.error) throw ordersResult.error;

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

  const statCards = [
    {
      label: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
    },
    {
      label: "Visitors",
      value: stats.visitors.toString(),
      icon: Eye,
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
  ];

  const quickActions = [
    {
      title: "Generate Business",
      description: "Use AI to build your first creator business.",
      href: "/ai-builder",
    },
    {
      title: "Business Command Center",
      description:
        businesses.length > 0
          ? "Manage your latest saved business."
          : "Your business command center appears after saving a business.",
      href:
        businesses.length > 0
          ? `/dashboard/business/${businesses[0].id}`
          : "/ai-builder",
    },
    {
      title: "Browse Marketplace",
      description: "Explore the future CreatorOS AI marketplace.",
      href: "/marketplace",
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">
              Creator Command Center
            </p>

            <h1 className="text-4xl font-bold md:text-6xl">
              Welcome to CreatorOS AI
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-400">
              Build your business, launch your storefront, manage products,
              track orders, and deploy AI employees from one powerful dashboard.
            </p>
          </div>

          <Link
            href="/ai-builder"
            className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
          >
            Build With AI
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                  <Icon size={22} />
                </div>

                <p className="text-sm text-zinc-400">{stat.label}</p>
                <h2 className="mt-2 text-3xl font-bold">{stat.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
                <Sparkles size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold">AI Launch Checklist</h2>
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
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-yellow-400">
                        {index + 1}
                      </span>

                      <p className="font-medium">{item}</p>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                        completed
                          ? "border-green-500/20 bg-green-500/10 text-green-300"
                          : "border-white/10 bg-white/[0.04] text-zinc-400"
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {completed ? "Complete" : "Pending"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
              <Bot size={24} />
            </div>

            <h2 className="text-2xl font-bold">Your AI Employee</h2>

            <p className="mt-3 text-sm leading-6 text-zinc-300">
              You currently have{" "}
              <span className="font-bold text-yellow-400">
                {stats.aiAgents}
              </span>{" "}
              AI employee{stats.aiAgents === 1 ? "" : "s"} connected to your
              creator businesses.
            </p>

            <Link
              href="/ai-builder"
              className="mt-6 inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300"
            >
              Start Building
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <BriefcaseBusiness className="text-yellow-400" />
              <h2 className="text-xl font-bold">Recent Businesses</h2>
            </div>

            {businesses.length === 0 ? (
              <p className="text-sm leading-6 text-zinc-400">
                No businesses saved yet. Generate your first business with AI
                to see it appear here.
              </p>
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
                        className="font-bold text-white hover:text-yellow-400"
                      >
                        {business.name}
                      </Link>

                      <p className="mt-1 text-sm text-zinc-500">
                        /storefront/{business.slug}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs capitalize text-zinc-400">
                        {business.status ?? "draft"}
                      </span>

                      <Link
                        href={`/storefront/${business.slug}`}
                        className="inline-flex items-center gap-2 rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400 hover:bg-yellow-400/20"
                      >
                        <Globe size={14} />
                        Storefront
                      </Link>

                      <Link
                        href={`/dashboard/business/${business.id}`}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-zinc-300 hover:border-yellow-400/50"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <BriefcaseBusiness className="text-yellow-400" />
              <h2 className="text-xl font-bold">Quick Actions</h2>
            </div>

            <div className="grid gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className="rounded-2xl border border-white/10 bg-black/40 p-5 transition hover:border-yellow-400/50"
                >
                  <h3 className="font-bold text-white">{action.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
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