import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  Mail,
  Repeat,
  Rocket,
  Send,
  Settings,
  ShoppingBag,
  Sparkles,
  TriangleAlert,
  Users,
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
  title?: string | null;
  name?: string | null;
  description?: string | null;
  type?: string | null;
  trigger: string | null;
  action: string | null;
  status?: string | null;
  runs_count?: number | null;
  is_active?: boolean | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type AutomationEventStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

type AutomationEventType =
  | "funnel_lead_submitted"
  | "lead_follow_up"
  | "booking_request_follow_up"
  | "customer_thank_you"
  | "internal_notification"
  | "custom";

type AutomationEventRow = {
  id: string;
  business_id: string;

  funnel_id: string | null;
  funnel_page_id: string | null;
  lead_form_id: string | null;
  funnel_submission_id: string | null;
  lead_id: string | null;

  event_type: AutomationEventType;
  status: AutomationEventStatus;

  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_name: string | null;

  subject: string | null;
  message: string | null;

  scheduled_for: string | null;
  sent_at: string | null;

  attempts: number | null;
  last_error: string | null;

  metadata: Record<string, unknown> | null;

  created_at: string;
  updated_at: string | null;
};

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

async function loadAutomationPage(id: string) {
  const [businessResult, automationsResult, automationEventsResult] =
    await Promise.all([
      supabaseAdmin.from("businesses").select("id, name").eq("id", id).single(),

      supabaseAdmin
        .from("automations")
        .select("*")
        .eq("business_id", id)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("automation_events")
        .select("*")
        .eq("business_id", id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (businessResult.error || !businessResult.data) return null;
  if (automationsResult.error) throw automationsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    automations: (automationsResult.data ?? []) as AutomationRow[],
    automationEvents: automationEventsResult.error
      ? []
      : ((automationEventsResult.data ?? []) as AutomationEventRow[]),
  };
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatEventType(value: string) {
  return value.replaceAll("_", " ");
}

function getAutomationStatus(automation: AutomationRow) {
  if (automation.status) return automation.status;
  if (automation.is_active === false) return "paused";
  return "active";
}

function getStatusClass(status: string) {
  if (status === "sent" || status === "active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending" || status === "processing") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }

  if (status === "failed") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  if (status === "cancelled" || status === "paused") {
    return "border-white/10 bg-white/[0.04] text-zinc-400";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

export default async function AutomationPage({ params }: Props) {
  const { id } = await params;
  const data = await loadAutomationPage(id);

  if (!data) notFound();

  const { business, automations, automationEvents } = data;

  const activeAutomations = automations.filter(
    (automation) => getAutomationStatus(automation) === "active"
  );

  const pausedAutomations = automations.filter(
    (automation) => getAutomationStatus(automation) === "paused"
  );

  const totalRuns = automations.reduce(
    (sum, automation) => sum + Number(automation.runs_count ?? 0),
    0
  );

  const pendingEvents = automationEvents.filter(
    (event) => event.status === "pending"
  );

  const processingEvents = automationEvents.filter(
    (event) => event.status === "processing"
  );

  const sentEvents = automationEvents.filter((event) => event.status === "sent");

  const failedEvents = automationEvents.filter(
    (event) => event.status === "failed"
  );

  const leadFollowUps = automationEvents.filter(
    (event) => event.event_type === "lead_follow_up"
  );

  const internalNotifications = automationEvents.filter(
    (event) => event.event_type === "internal_notification"
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
                  Build workflows that connect funnel leads, purchases, emails,
                  AI employees, CRM updates, customer follow-ups, reviews,
                  reports, and upsells.
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
                  href="#automation-events"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-400/20"
                >
                  <Send className="h-4 w-4" />
                  Follow-Up Queue
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
            <Clock className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-yellow-100/60">Pending Queue</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-100">
              {pendingEvents.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
            <Zap className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-yellow-100/60">Processing</p>
            <h2 className="mt-2 text-3xl font-black text-yellow-100">
              {processingEvents.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <CheckCircle2 className="h-7 w-7 text-emerald-300" />
            <p className="mt-4 text-xs text-emerald-100/60">Sent</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-100">
              {sentEvents.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
            <TriangleAlert className="h-7 w-7 text-red-300" />
            <p className="mt-4 text-xs text-red-100/60">Failed</p>
            <h2 className="mt-2 text-3xl font-black text-red-100">
              {failedEvents.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Users className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Lead Follow-Ups</p>
            <h2 className="mt-2 text-3xl font-black">
              {leadFollowUps.length}
            </h2>
          </div>
        </div>

        <div id="automation-manager">
          <AutomationsClient
            businessId={business.id}
            initialAutomations={automations}
            initialAutomationEvents={automationEvents}
            templates={workflowTemplates.map((template) => ({
              title: template.title,
              trigger: template.trigger,
              action: template.action,
            }))}
          />
        </div>

        <div
          id="automation-events"
          className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Send className="h-5 w-5 text-yellow-200" />

              <div>
                <h2 className="text-2xl font-black text-yellow-100">
                  Follow-Up Automation Queue
                </h2>

                <p className="mt-1 text-sm text-yellow-100/65">
                  Funnel submissions create pending follow-up and internal
                  notification events here.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/dashboard/business/${business.id}/funnels`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-black/30 px-5 py-3 text-sm font-black text-yellow-100 transition hover:bg-yellow-400/10"
              >
                <Rocket className="h-4 w-4" />
                Open Funnels
              </Link>

              <Link
                href={`/dashboard/business/${business.id}/crm`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
              >
                <Users className="h-4 w-4" />
                View CRM Leads
              </Link>
            </div>
          </div>

          {automationEvents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-yellow-400/25 bg-black/30 p-8 text-center">
              <Send className="mx-auto h-10 w-10 text-yellow-200/70" />

              <h3 className="mt-4 text-xl font-black text-yellow-100">
                No automation events yet
              </h3>

              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-yellow-100/65">
                Submit a public funnel form to create a CRM lead, funnel
                submission, conversion events, and pending follow-up automation
                events.
              </p>

              <Link
                href={`/dashboard/business/${business.id}/funnels`}
                className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
              >
                <Sparkles className="h-4 w-4" />
                Build Funnel
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {automationEvents.slice(0, 12).map((event) => (
                <div
                  key={event.id}
                  className="rounded-3xl border border-yellow-400/20 bg-black/30 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-yellow-100">
                          {event.subject || "Automation Event"}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${getStatusClass(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-300">
                          {formatEventType(event.event_type)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-3 text-sm text-yellow-100/70">
                        {event.recipient_email ? (
                          <span className="inline-flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2">
                            <Mail className="h-4 w-4 text-yellow-200" />
                            {event.recipient_email}
                          </span>
                        ) : null}

                        {event.recipient_name ? (
                          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                            <Users className="h-4 w-4 text-yellow-200" />
                            {event.recipient_name}
                          </span>
                        ) : null}

                        <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          <CalendarClock className="h-4 w-4 text-yellow-200" />
                          {formatDate(event.scheduled_for)}
                        </span>
                      </div>

                      {event.message ? (
                        <p className="mt-4 line-clamp-3 text-sm leading-6 text-yellow-100/65">
                          {event.message}
                        </p>
                      ) : null}

                      {event.last_error ? (
                        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm leading-6 text-red-200">
                          <span className="font-black">Error:</span>{" "}
                          {event.last_error}
                        </div>
                      ) : null}
                    </div>

                    <div className="shrink-0 text-left lg:text-right">
                      <p className="text-xs font-black uppercase tracking-wide text-yellow-100/50">
                        Attempts
                      </p>

                      <p className="mt-2 text-3xl font-black text-yellow-100">
                        {event.attempts ?? 0}
                      </p>

                      {event.sent_at ? (
                        <p className="mt-2 text-xs text-emerald-300">
                          Sent {formatDate(event.sent_at)}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {internalNotifications.length > 0 ? (
            <p className="mt-5 text-sm leading-6 text-yellow-100/60">
              Internal notifications queued:{" "}
              <span className="font-black text-yellow-100">
                {internalNotifications.length}
              </span>
            </p>
          ) : null}
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