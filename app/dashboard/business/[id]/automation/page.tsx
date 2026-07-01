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
  Zap,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import AutomationsClient from "./client";

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

type AutomationRow = {
  id: string;
  business_id: string;
  name: string | null;
  trigger: string | null;
  action: string | null;
  status: string | null;
  runs_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function loadAutomationPage(id: string) {
  const [businessResult, automationsResult] = await Promise.all([
    supabaseAdmin.from("businesses").select("id, name").eq("id", id).single(),

    supabaseAdmin
      .from("automations")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) return null;
  if (automationsResult.error) throw automationsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    automations: (automationsResult.data ?? []) as AutomationRow[],
  };
}

const workflowTemplates = [
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
  const data = await loadAutomationPage(id);

  if (!data) notFound();

  const { business, automations } = data;

  const activeAutomations = automations.filter(
    (automation) => automation.status === "active"
  );

  const pausedAutomations = automations.filter(
    (automation) => automation.status === "paused"
  );

  const totalRuns = automations.reduce(
    (sum, automation) => sum + Number(automation.runs_count ?? 0),
    0
  );

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
                  <Workflow className="h-3.5 w-3.5" />
                  AI Automation Builder
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Automate {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Build workflows that connect purchases, emails, AI employees,
                  CRM updates, customer follow-ups, reviews, and upsells.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#automation-manager"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Sparkles className="h-4 w-4" />
                  Create Workflow
                </a>

                <a
                  href="#workflow-templates"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Workflow className="h-4 w-4" />
                  Browse Templates
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Workflow className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Total Workflows</p>
            <h2 className="mt-2 text-3xl font-black">{automations.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Zap className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Active</p>
            <h2 className="mt-2 text-3xl font-black">
              {activeAutomations.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Repeat className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Total Runs</p>
            <h2 className="mt-2 text-3xl font-black">{totalRuns}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Settings className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Paused</p>
            <h2 className="mt-2 text-3xl font-black">
              {pausedAutomations.length}
            </h2>
          </div>
        </div>

        <div id="automation-manager">
          <AutomationsClient
            businessId={business.id}
            initialAutomations={automations}
            templates={workflowTemplates.map((template) => ({
              title: template.title,
              trigger: template.trigger,
              action: template.action,
            }))}
          />
        </div>

        <div
          id="workflow-templates"
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-yellow-200" />
            <h2 className="text-2xl font-black">Workflow Templates</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {workflowTemplates.map((workflow) => {
              const Icon = workflow.icon;

              return (
                <div
                  key={workflow.title}
                  className="rounded-3xl border border-white/10 bg-black/40 p-6"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-xl font-black">{workflow.title}</h3>

                  <div className="mt-4 space-y-3 text-sm leading-6 text-zinc-300">
                    <p>
                      <span className="font-black text-yellow-200">
                        Trigger:
                      </span>{" "}
                      {workflow.trigger}
                    </p>

                    <p>
                      <span className="font-black text-yellow-200">
                        Action:
                      </span>{" "}
                      {workflow.action}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}