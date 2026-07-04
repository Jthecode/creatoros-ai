import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  DollarSign,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Sparkles,
  Target,
  User,
  Users,
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

type Customer = {
  id: string;
  customer_email: string | null;
  total_cents: number | null;
  status: string | null;
  created_at: string;
};

type Lead = {
  id: string;
  business_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string | null;
  notes?: string | null;
  created_at: string;
};

type FunnelSubmission = {
  id: string;
  business_id: string;
  funnel_id: string | null;
  funnel_page_id: string | null;
  lead_form_id: string | null;
  lead_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  source: string | null;
  status: string | null;
  page_url: string | null;
  created_at: string;
};

type CRMContact = {
  id: string;
  type: "customer" | "lead" | "funnel_submission";
  name: string;
  email: string | null;
  phone: string | null;
  status: string | null;
  source: string;
  value_cents: number;
  message: string | null;
  created_at: string;
  page_url?: string | null;
};

async function loadCRM(id: string) {
  const [businessResult, ordersResult, leadsResult, submissionsResult] =
    await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id,name")
        .eq("id", id)
        .single(),

      supabaseAdmin
        .from("orders")
        .select("id, customer_email, total_cents, status, created_at")
        .eq("business_id", id)
        .order("created_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("leads")
        .select("id, business_id, name, email, phone, source, status, notes, created_at")
        .eq("business_id", id)
        .order("created_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("funnel_submissions")
        .select(
          "id, business_id, funnel_id, funnel_page_id, lead_form_id, lead_id, name, email, phone, company, message, source, status, page_url, created_at"
        )
        .eq("business_id", id)
        .order("created_at", {
          ascending: false,
        }),
    ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (ordersResult.error) throw ordersResult.error;
  if (leadsResult.error) throw leadsResult.error;
  if (submissionsResult.error) throw submissionsResult.error;

  return {
    business: businessResult.data as Business,
    customers: (ordersResult.data ?? []) as Customer[],
    leads: (leadsResult.data ?? []) as Lead[],
    funnelSubmissions: (submissionsResult.data ?? []) as FunnelSubmission[],
  };
}

function formatMoney(cents: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getContactName(contact: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}) {
  return contact.name || contact.email || contact.phone || "New Contact";
}

function buildContacts(options: {
  customers: Customer[];
  leads: Lead[];
  funnelSubmissions: FunnelSubmission[];
}) {
  const { customers, leads, funnelSubmissions } = options;

  const customerContacts: CRMContact[] = customers.map((customer) => ({
    id: customer.id,
    type: "customer",
    name: customer.customer_email || "Customer",
    email: customer.customer_email,
    phone: null,
    status: customer.status,
    source: "order",
    value_cents: Number(customer.total_cents ?? 0),
    message: null,
    created_at: customer.created_at,
  }));

  const leadContacts: CRMContact[] = leads.map((lead) => ({
    id: lead.id,
    type: "lead",
    name: getContactName(lead),
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    source: lead.source || "lead",
    value_cents: 0,
    message: lead.notes || null,
    created_at: lead.created_at,
  }));

  const funnelContacts: CRMContact[] = funnelSubmissions.map((submission) => ({
    id: submission.id,
    type: "funnel_submission",
    name: getContactName(submission),
    email: submission.email,
    phone: submission.phone,
    status: submission.status,
    source: submission.source || "funnel",
    value_cents: 0,
    message: submission.message,
    created_at: submission.created_at,
    page_url: submission.page_url,
  }));

  return [...customerContacts, ...leadContacts, ...funnelContacts].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export default async function CRMPage({ params }: Props) {
  const { id } = await params;

  const data = await loadCRM(id);

  if (!data) {
    notFound();
  }

  const { business, customers, leads, funnelSubmissions } = data;

  const contacts = buildContacts({
    customers,
    leads,
    funnelSubmissions,
  });

  const revenue = customers.reduce(
    (sum, customer) => sum + Number(customer.total_cents ?? 0),
    0
  );

  const uniqueEmails = new Set(
    contacts.map((contact) => contact.email).filter(Boolean)
  );

  const uniquePhones = new Set(
    contacts.map((contact) => contact.phone).filter(Boolean)
  );

  const totalContacts =
    uniqueEmails.size + uniquePhones.size > 0
      ? Math.max(uniqueEmails.size, uniquePhones.size)
      : contacts.length;

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="mb-8 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200"
        >
          <ArrowLeft size={18} />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-yellow-400/20 bg-yellow-400/10">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <p className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-yellow-200">
                <Users className="h-3.5 w-3.5" />
                AI CRM
              </p>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
                {business.name} CRM
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-yellow-100/75 sm:text-base">
                Manage customers, funnel leads, submissions, purchases,
                conversations, AI summaries, lifetime value, and follow-ups.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300">
                  <Plus size={18} />
                  Add Customer
                </button>

                <button className="inline-flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-black/30 px-6 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-400/10">
                  <Bot size={18} />
                  AI Analyze CRM
                </button>

                <Link
                  href={`/dashboard/business/${business.id}/funnels`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-black/30 px-6 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-400/10"
                >
                  <Sparkles size={18} />
                  Funnel Leads
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">CRM Contacts</p>
            <h2 className="mt-2 text-3xl font-black">{totalContacts}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <User className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Customers</p>
            <h2 className="mt-2 text-3xl font-black">{customers.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Target className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Funnel Leads</p>
            <h2 className="mt-2 text-3xl font-black">
              {funnelSubmissions.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <DollarSign className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Revenue</p>
            <h2 className="mt-2 text-3xl font-black">{formatMoney(revenue)}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Bot className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">AI Insights</p>
            <h2 className="mt-2 text-3xl font-black">Ready</h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-yellow-400" />

              <div>
                <h2 className="text-2xl font-black">Customer Database</h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Orders, manual leads, and funnel submissions in one CRM view.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
              <Search size={18} />
              <span className="text-sm text-zinc-500">Search coming soon...</span>
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
              <Users size={60} className="mx-auto text-yellow-400" />

              <h3 className="mt-5 text-2xl font-black">No Contacts Yet</h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Customers will appear after purchases. Funnel leads will appear
                after someone submits a public funnel form.
              </p>

              <Link
                href={`/dashboard/business/${business.id}/funnels`}
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
              >
                <Sparkles className="h-4 w-4" />
                Open Funnel Builder
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {contacts.map((contact) => {
                const isFunnelLead = contact.type === "funnel_submission";
                const isLead = contact.type === "lead";
                const isCustomer = contact.type === "customer";

                return (
                  <div
                    key={`${contact.type}-${contact.id}`}
                    className="rounded-3xl border border-white/10 bg-black/30 p-6"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div
                            className={
                              isFunnelLead
                                ? "rounded-2xl bg-yellow-400/10 p-3 text-yellow-400"
                                : isCustomer
                                  ? "rounded-2xl bg-emerald-400/10 p-3 text-emerald-300"
                                  : "rounded-2xl bg-white/10 p-3 text-zinc-300"
                            }
                          >
                            {isFunnelLead ? (
                              <Target size={20} />
                            ) : isCustomer ? (
                              <DollarSign size={20} />
                            ) : (
                              <User size={20} />
                            )}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-black">{contact.name}</h3>

                              <span
                                className={
                                  isFunnelLead
                                    ? "rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200"
                                    : isCustomer
                                      ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-300"
                                      : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black text-zinc-300"
                                }
                              >
                                {isFunnelLead
                                  ? "Funnel Lead"
                                  : isCustomer
                                    ? "Customer"
                                    : "Lead"}
                              </span>

                              {contact.status ? (
                                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                                  {contact.status}
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                              Added {formatDate(contact.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3 text-sm text-zinc-300">
                          {contact.email ? (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                              <Mail size={16} className="text-yellow-400" />
                              {contact.email}
                            </div>
                          ) : null}

                          {contact.phone ? (
                            <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                              <Phone size={16} className="text-yellow-400" />
                              {contact.phone}
                            </div>
                          ) : null}

                          <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 capitalize">
                            <Target size={16} className="text-yellow-400" />
                            {contact.source}
                          </div>
                        </div>

                        {contact.message ? (
                          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-zinc-500">
                              Message / Notes
                            </p>
                            <p className="mt-2 text-sm leading-6 text-zinc-300">
                              {contact.message}
                            </p>
                          </div>
                        ) : null}

                        {contact.page_url ? (
                          <p className="mt-4 font-mono text-xs text-zinc-600">
                            Source page: {contact.page_url}
                          </p>
                        ) : null}

                        <div className="mt-6 flex flex-wrap gap-3">
                          {contact.email ? (
                            <a
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold transition hover:border-yellow-400/40 hover:text-yellow-200"
                            >
                              <Mail size={16} />
                              Email
                            </a>
                          ) : null}

                          {contact.phone ? (
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold transition hover:border-yellow-400/40 hover:text-yellow-200"
                            >
                              <Phone size={16} />
                              Call
                            </a>
                          ) : null}

                          <button className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-bold transition hover:border-yellow-400/40 hover:text-yellow-200">
                            <MessageCircle size={16} />
                            Chat
                          </button>
                        </div>
                      </div>

                      <div className="shrink-0 text-left lg:text-right">
                        <p className="text-sm text-zinc-500">
                          {isCustomer ? "Lifetime Value" : "Potential Value"}
                        </p>

                        <h2 className="mt-2 text-3xl font-black text-yellow-400">
                          {formatMoney(contact.value_cents)}
                        </h2>

                        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-zinc-600">
                          {isLead ? "Manual / CRM Lead" : contact.type.replaceAll("_", " ")}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}