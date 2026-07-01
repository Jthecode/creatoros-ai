import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Plus,
  Search,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  XCircle,
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
  slug: string | null;
};

type LeadRow = {
  id: string;
  business_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: string | null;
  value: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  customer_email: string | null;
  total?: number | null;
  total_cents?: number | null;
  payment_status?: string | null;
  status?: string | null;
};

async function loadLeads(id: string) {
  const [businessResult, leadsResult, ordersResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("leads")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin.from("orders").select("*").eq("business_id", id),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (leadsResult.error) throw leadsResult.error;
  if (ordersResult.error) throw ordersResult.error;

  return {
    business: businessResult.data as BusinessRow,
    leads: (leadsResult.data ?? []) as LeadRow[],
    orders: (ordersResult.data ?? []) as OrderRow[],
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function getOrderTotal(order: OrderRow) {
  if (typeof order.total === "number") return order.total;
  if (typeof order.total_cents === "number") return order.total_cents / 100;
  return 0;
}

function getLeadStatus(lead: LeadRow) {
  return lead.status || "new";
}

function getStatusStyles(status: string | null) {
  if (status === "won") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "lost") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (status === "qualified" || status === "proposal") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function getStatusIcon(status: string | null) {
  if (status === "won") return CheckCircle2;
  if (status === "lost") return XCircle;
  return Clock;
}

export default async function LeadsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadLeads(id);

  if (!data) {
    notFound();
  }

  const { business, leads, orders } = data;

  const newLeads = leads.filter((lead) => getLeadStatus(lead) === "new");
  const qualifiedLeads = leads.filter(
    (lead) => getLeadStatus(lead) === "qualified"
  );
  const proposalLeads = leads.filter(
    (lead) => getLeadStatus(lead) === "proposal"
  );
  const wonLeads = leads.filter((lead) => getLeadStatus(lead) === "won");
  const lostLeads = leads.filter((lead) => getLeadStatus(lead) === "lost");

  const paidOrders = orders.filter((order) => {
    const status = order.payment_status || order.status;
    return status === "paid" || status === "completed" || status === "succeeded";
  });

  const revenue = paidOrders.reduce(
    (sum, order) => sum + getOrderTotal(order),
    0
  );

  const pipelineValue = leads.reduce(
    (sum, lead) => sum + Number(lead.value ?? 0),
    0
  );

  const conversionRate =
    leads.length > 0 ? Math.round((wonLeads.length / leads.length) * 100) : 0;

  const pipelineStages = [
    {
      label: "New",
      value: newLeads.length,
      icon: UserPlus,
    },
    {
      label: "Contacted",
      value: leads.filter((lead) => getLeadStatus(lead) === "contacted").length,
      icon: Mail,
    },
    {
      label: "Qualified",
      value: qualifiedLeads.length,
      icon: Target,
    },
    {
      label: "Proposal",
      value: proposalLeads.length,
      icon: BriefcaseBusiness,
    },
    {
      label: "Won",
      value: wonLeads.length,
      icon: CheckCircle2,
    },
  ];

  const statCards = [
    {
      label: "Total Leads",
      value: leads.length.toString(),
      icon: Users,
    },
    {
      label: "New Leads",
      value: newLeads.length.toString(),
      icon: UserPlus,
    },
    {
      label: "Qualified",
      value: qualifiedLeads.length.toString(),
      icon: Target,
    },
    {
      label: "Conversion",
      value: `${conversionRate}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Users className="h-3.5 w-3.5" />
                  AI Lead Manager
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Leads for {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Manage leads, sales status, sources, contact details,
                  follow-ups, pipeline value, and AI-powered CRM actions.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#lead-database"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Plus className="h-4 w-4" />
                  Manage Leads
                </a>

                <Link
                  href={`/dashboard/business/${business.id}/automation`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Bot className="h-4 w-4" />
                  Automate Follow-Up
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="text-xs text-zinc-500">{card.label}</p>
                <h2 className="mt-2 text-3xl font-black">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <CheckCircle2 className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Won Leads</p>
            <h2 className="mt-2 text-3xl font-black">{wonLeads.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <TrendingUp className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Revenue</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatCurrency(revenue)}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Target className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Pipeline Value</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatCurrency(pipelineValue)}
            </h2>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <Target className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black">Sales Pipeline</h2>
              <p className="text-sm text-zinc-500">
                Current lead status breakdown.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {pipelineStages.map((stage) => {
              const Icon = stage.icon;

              return (
                <div
                  key={stage.label}
                  className="rounded-3xl border border-white/10 bg-black/40 p-5"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                    <Icon className="h-5 w-5" />
                  </div>

                  <p className="text-sm text-zinc-400">{stage.label}</p>
                  <h3 className="mt-2 text-3xl font-black">{stage.value}</h3>
                </div>
              );
            })}
          </div>
        </div>

        <div
          id="lead-database"
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">Lead Database</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Leads captured from storefronts, forms, campaigns, AI chats, and
                manual entry appear here.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-zinc-500">
              <Search className="h-4 w-4" />
              <span className="text-sm">
                Step 10 adds search, create, edit, and status updates
              </span>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/40 p-10 text-center">
              <Users className="mx-auto h-14 w-14 text-yellow-200" />

              <h3 className="mt-5 text-2xl font-black">No leads yet</h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Leads will appear here when someone fills out a form, talks to
                an AI employee, requests information, or is added manually.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="hidden grid-cols-7 border-b border-white/10 bg-black/60 px-5 py-4 text-sm font-bold text-zinc-400 lg:grid">
                <span>Name</span>
                <span>Email</span>
                <span>Phone</span>
                <span>Company</span>
                <span>Source</span>
                <span>Status</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-white/10">
                {leads.map((lead) => {
                  const status = getLeadStatus(lead);
                  const StatusIcon = getStatusIcon(status);

                  return (
                    <div
                      key={lead.id}
                      className="grid gap-4 bg-black/30 p-5 lg:grid-cols-7 lg:items-center"
                    >
                      <div>
                        <p className="font-bold">{lead.name || "Unnamed lead"}</p>

                        <p className="mt-1 text-xs text-zinc-500">
                          Added {formatDate(lead.created_at)}
                        </p>
                      </div>

                      <p className="text-sm text-zinc-300">
                        {lead.email || "No email"}
                      </p>

                      <p className="text-sm text-zinc-300">
                        {lead.phone || "No phone"}
                      </p>

                      <p className="text-sm text-zinc-300">
                        {lead.company || "No company"}
                      </p>

                      <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-300">
                        {lead.source || "website"}
                      </span>

                      <span
                        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusStyles(
                          status
                        )}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status}
                      </span>

                      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                        {lead.email ? (
                          <a
                            href={`mailto:${lead.email}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-200"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                        ) : null}

                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-200"
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
              <Bot className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black text-yellow-100">
                AI Lead Engine Ready
              </h2>
              <p className="mt-2 text-sm leading-7 text-yellow-100/75">
                Step 10 will add the interactive lead CRM client so you can
                create leads, update statuses, search the pipeline, and manage
                lead notes from this page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}