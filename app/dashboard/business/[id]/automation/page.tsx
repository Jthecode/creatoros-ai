import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Mail,
  Repeat,
  Settings,
  ShoppingBag,
  Sparkles,
  Workflow,
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
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as BusinessRow;
}

const workflows = [
  {
    title: "New Purchase Follow-Up",
    trigger: "Customer buys a product",
    action: "Send thank-you email and upsell offer",
    icon: ShoppingBag,
  },
  {
    title: "Lead Capture",
    trigger: "Visitor submits form",
    action: "Add to CRM and send welcome email",
    icon: Mail,
  },
  {
    title: "AI Sales Follow-Up",
    trigger: "Customer asks a question",
    action: "AI sends helpful follow-up message",
    icon: Bot,
  },
  {
    title: "Weekly Business Report",
    trigger: "Every Monday morning",
    action: "Send revenue, orders, and growth summary",
    icon: CalendarClock,
  },
];

export default async function AutomationPage({ params }: Props) {
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
            AI Automation Builder
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Automate {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Build workflows that connect purchases, emails, AI employees, CRM
            updates, customer follow-ups, reviews, and upsells.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Sparkles size={18} />
              Create AI Workflow
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <Workflow size={18} />
              Browse Templates
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Workflow className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Active Workflows</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Repeat className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Runs This Month</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Settings className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Automation Status</p>
            <h2 className="mt-2 text-3xl font-bold">Ready</h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="text-yellow-400" />
            <h2 className="text-2xl font-bold">Workflow Templates</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;

              return (
                <div
                  key={workflow.title}
                  className="rounded-3xl border border-white/10 bg-black/40 p-6"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                    <Icon size={22} />
                  </div>

                  <h3 className="text-xl font-bold">{workflow.title}</h3>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                    <p>
                      <span className="font-bold text-yellow-400">
                        Trigger:
                      </span>{" "}
                      {workflow.trigger}
                    </p>

                    <p>
                      <span className="font-bold text-yellow-400">
                        Action:
                      </span>{" "}
                      {workflow.action}
                    </p>
                  </div>

                  <button className="mt-6 w-full rounded-2xl border border-yellow-400/40 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400/10">
                    Use Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}