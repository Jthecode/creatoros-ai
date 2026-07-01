import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  DollarSign,
  Handshake,
  Megaphone,
  PhoneCall,
  Plus,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  description: string | null;
  audience: string | null;
};

type OrderRow = {
  id: string;
  customer_email: string | null;
  total_cents: number | null;
  status: string | null;
};

async function loadSalesData(id: string) {
  const [businessResult, ordersResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, description, audience")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("orders")
      .select("id, customer_email, total_cents, status")
      .eq("business_id", id),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (ordersResult.error) throw ordersResult.error;

  return {
    business: businessResult.data as BusinessRow,
    orders: (ordersResult.data ?? []) as OrderRow[],
  };
}

function formatCurrency(cents: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

const pipelineStages = [
  {
    title: "New Leads",
    description: "People who showed interest but have not purchased yet.",
    icon: Users,
  },
  {
    title: "Contacted",
    description: "Leads that received a message, email, or AI follow-up.",
    icon: PhoneCall,
  },
  {
    title: "Interested",
    description: "People asking questions or comparing offers.",
    icon: Target,
  },
  {
    title: "Offer Sent",
    description: "Leads who received a package, price, or checkout link.",
    icon: Megaphone,
  },
  {
    title: "Closed",
    description: "Customers who purchased or converted.",
    icon: Handshake,
  },
];

export default async function SalesPage({ params }: Props) {
  const { id } = await params;
  const data = await loadSalesData(id);

  if (!data) {
    notFound();
  }

  const { business, orders } = data;

  const paidOrders = orders.filter((order) => order.status === "paid");
  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_cents ?? 0),
    0
  );

  const uniqueCustomers = new Set(
    orders.map((order) => order.customer_email).filter(Boolean)
  );

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
            AI Sales Pipeline
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Sales for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Track leads, opportunities, follow-ups, deals, checkout activity,
            AI employee conversions, and customer value from one sales command
            center.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Plus size={18} />
              Add Lead
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <Bot size={18} />
              AI Sales Review
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <DollarSign className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Closed Revenue</p>
            <h2 className="mt-2 text-3xl font-bold">
              {formatCurrency(revenue)}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Handshake className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Closed Deals</p>
            <h2 className="mt-2 text-3xl font-bold">{paidOrders.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Customers</p>
            <h2 className="mt-2 text-3xl font-bold">
              {uniqueCustomers.size}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <TrendingUp className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Pipeline Value</p>
            <h2 className="mt-2 text-3xl font-bold">
              {formatCurrency(revenue)}
            </h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Target className="text-yellow-400" />
            <h2 className="text-2xl font-bold">Pipeline Stages</h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {pipelineStages.map((stage) => {
              const Icon = stage.icon;

              return (
                <div
                  key={stage.title}
                  className="rounded-3xl border border-white/10 bg-black/40 p-5"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                    <Icon size={22} />
                  </div>

                  <h3 className="font-bold">{stage.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {stage.description}
                  </p>

                  <p className="mt-5 text-3xl font-bold text-yellow-400">
                    {stage.title === "Closed" ? paidOrders.length : 0}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Bot className="text-yellow-400" />
            <h2 className="text-2xl font-bold">AI Sales Coach</h2>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
            <p className="text-sm leading-7 text-zinc-300">
              CreatorOS AI will analyze your leads, orders, offer structure,
              pricing, objections, and customer behavior to recommend better
              follow-ups, stronger offers, and higher-converting sales funnels.
            </p>

            <button className="mt-6 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              Generate Sales Strategy
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}