"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Plus,
  Power,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Wand2,
  XCircle,
  Zap,
} from "lucide-react";

type AutomationStatus = "active" | "paused";
type AutomationType = "sales" | "marketing" | "support" | "operations";

type Automation = {
  id: string;
  business_id: string;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  type?: AutomationType | string | null;
  status?: string | null;
  trigger: string | null;
  action: string | null;
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

type AutomationEvent = {
  id: string;
  business_id: string;

  funnel_id: string | null;
  funnel_page_id: string | null;
  lead_form_id: string | null;
  funnel_submission_id: string | null;
  lead_id: string | null;

  event_type:
    | "funnel_lead_submitted"
    | "lead_follow_up"
    | "booking_request_follow_up"
    | "customer_thank_you"
    | "internal_notification"
    | "custom";

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

type Template = {
  title: string;
  trigger: string;
  action: string;
};

type Props = {
  businessId: string;
  initialAutomations?: Automation[];
  initialAutomationEvents?: AutomationEvent[];
  templates?: Template[];
};

const automationTypes: {
  value: AutomationType;
  label: string;
}[] = [
  { value: "sales", label: "Sales" },
  { value: "marketing", label: "Marketing" },
  { value: "support", label: "Support" },
  { value: "operations", label: "Operations" },
];

const defaultTemplates: Template[] = [
  {
    title: "New Lead Follow-Up",
    trigger: "New lead submitted",
    action: "Send AI follow-up message",
  },
  {
    title: "Abandoned Checkout Recovery",
    trigger: "Checkout started but not completed",
    action: "Send recovery email",
  },
  {
    title: "Weekly Marketing Ideas",
    trigger: "Every Monday",
    action: "Generate marketing ideas",
  },
];

function normalizeAutomation(row: Automation): Automation {
  const status = row.status || (row.is_active === false ? "paused" : "active");
  const title = row.name || row.title || "Untitled Automation";

  return {
    ...row,
    name: title,
    title,
    description: row.description ?? null,
    type: row.type || "sales",
    status,
    trigger: row.trigger || null,
    action: row.action || null,
    runs_count: row.runs_count ?? 0,
    is_active: status === "active",
    metadata: row.metadata ?? {},
  };
}

function normalizeAutomationEvent(row: AutomationEvent): AutomationEvent {
  return {
    ...row,
    status: row.status || "pending",
    attempts: row.attempts ?? 0,
    metadata: row.metadata ?? {},
  };
}

function formatEventType(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getEventStatusClass(status: AutomationEventStatus) {
  if (status === "sent") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending" || status === "processing") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }

  if (status === "failed") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-400";
}

export default function AutomationsClient({
  businessId,
  initialAutomations = [],
  initialAutomationEvents = [],
  templates = defaultTemplates,
}: Props) {
  const [automations, setAutomations] = useState<Automation[]>(
    initialAutomations.map(normalizeAutomation)
  );

  const [automationEvents, setAutomationEvents] = useState<AutomationEvent[]>(
    initialAutomationEvents.map(normalizeAutomationEvent)
  );

  const [name, setName] = useState("");
  const [type, setType] = useState<AutomationType>("sales");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");
  const [query, setQuery] = useState("");
  const [eventQuery, setEventQuery] = useState("");

  const [automationSecret, setAutomationSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [eventBusyId, setEventBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const activeCount = useMemo(
    () => automations.filter((item) => item.status === "active").length,
    [automations]
  );

  const pausedCount = useMemo(
    () => automations.filter((item) => item.status === "paused").length,
    [automations]
  );

  const pendingEvents = useMemo(
    () => automationEvents.filter((event) => event.status === "pending"),
    [automationEvents]
  );

  const sentEvents = useMemo(
    () => automationEvents.filter((event) => event.status === "sent"),
    [automationEvents]
  );

  const failedEvents = useMemo(
    () => automationEvents.filter((event) => event.status === "failed"),
    [automationEvents]
  );

  const filteredAutomations = useMemo(() => {
    const search = query.toLowerCase();

    return automations.filter((automation) => {
      return (
        (automation.name ?? "").toLowerCase().includes(search) ||
        (automation.description ?? "").toLowerCase().includes(search) ||
        (automation.trigger ?? "").toLowerCase().includes(search) ||
        (automation.action ?? "").toLowerCase().includes(search) ||
        (automation.type ?? "").toLowerCase().includes(search)
      );
    });
  }, [automations, query]);

  const filteredAutomationEvents = useMemo(() => {
    const search = eventQuery.toLowerCase();

    return automationEvents.filter((event) => {
      return (
        event.event_type.toLowerCase().includes(search) ||
        event.status.toLowerCase().includes(search) ||
        (event.recipient_email ?? "").toLowerCase().includes(search) ||
        (event.recipient_name ?? "").toLowerCase().includes(search) ||
        (event.subject ?? "").toLowerCase().includes(search) ||
        (event.message ?? "").toLowerCase().includes(search)
      );
    });
  }, [automationEvents, eventQuery]);

  async function refreshAutomations() {
    try {
      setError("");
      setSuccess("");
      setBusyId("refresh");

      const res = await fetch(`/api/automations?businessId=${businessId}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load automations.");
      }

      setAutomations(
        Array.isArray(data.automations)
          ? data.automations.map(normalizeAutomation)
          : []
      );

      setSuccess("Automations refreshed.");
    } catch (refreshError) {
      console.error(refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh automations."
      );
    } finally {
      setBusyId("");
    }
  }

  async function refreshAutomationEvents() {
    try {
      setError("");
      setSuccess("");
      setEventBusyId("refresh-events");

      const res = await fetch(
        `/api/automation-events?businessId=${businessId}&limit=100`,
        {
          cache: "no-store",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to load automation events.");
      }

      setAutomationEvents(
        Array.isArray(data.events)
          ? data.events.map(normalizeAutomationEvent)
          : []
      );

      setSuccess("Automation queue refreshed.");
    } catch (refreshError) {
      console.error(refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh automation events."
      );
    } finally {
      setEventBusyId("");
    }
  }

  async function processAutomationEvents() {
    if (!automationSecret.trim()) {
      setError("Enter your AUTOMATION_SECRET to process pending automations.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const res = await fetch(
        `/api/automation-events/process?limit=10&secret=${encodeURIComponent(
          automationSecret.trim()
        )}`,
        {
          method: "POST",
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to process automation events.");
      }

      await refreshAutomationEvents();

      const sent = Number(data.totals?.sent ?? 0);
      const failed = Number(data.totals?.failed ?? 0);
      const skipped = Number(data.totals?.skipped ?? 0);

      setSuccess(
        `Processed automations. Sent: ${sent}. Failed: ${failed}. Skipped: ${skipped}.`
      );
    } catch (processError) {
      console.error(processError);
      setError(
        processError instanceof Error
          ? processError.message
          : "Unable to process automation events."
      );
    } finally {
      setProcessing(false);
    }
  }

  async function updateAutomationEvent(
    event: AutomationEvent,
    updates: Partial<AutomationEvent>
  ) {
    try {
      setEventBusyId(event.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/automation-events", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: event.id,
          ...updates,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update automation event.");
      }

      setAutomationEvents((current) =>
        current.map((item) =>
          item.id === event.id ? normalizeAutomationEvent(data.event) : item
        )
      );

      setSuccess("Automation event updated.");
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update automation event."
      );
    } finally {
      setEventBusyId("");
    }
  }

  async function retryAutomationEvent(event: AutomationEvent) {
    await updateAutomationEvent(event, {
      status: "pending",
      last_error: null,
    });
  }

  async function markAutomationEventSent(event: AutomationEvent) {
    await updateAutomationEvent(event, {
      status: "sent",
      sent_at: new Date().toISOString(),
      last_error: null,
    });
  }

  async function cancelAutomationEvent(event: AutomationEvent) {
    await updateAutomationEvent(event, {
      status: "cancelled",
    });
  }

  async function createAutomation(template?: Template) {
    const nextName = template?.title ?? name;
    const nextTrigger = template?.trigger ?? trigger;
    const nextAction = template?.action ?? action;
    const nextDescription =
      template?.title && !description
        ? `${template.trigger} → ${template.action}`
        : description;

    if (!nextName.trim() || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/automations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          business_id: businessId,
          name: nextName.trim(),
          title: nextName.trim(),
          type,
          description: nextDescription.trim(),
          trigger: nextTrigger.trim(),
          action: nextAction.trim(),
          status: "active",
          is_active: true,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to create automation.");
      }

      setAutomations((current) => [
        normalizeAutomation(data.automation),
        ...current,
      ]);

      setName("");
      setType("sales");
      setDescription("");
      setTrigger("");
      setAction("");

      setSuccess("Automation created.");
    } catch (createError) {
      console.error(createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create automation."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAutomation(automation: Automation) {
    const nextStatus: AutomationStatus =
      automation.status === "active" ? "paused" : "active";

    try {
      setBusyId(automation.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/automations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: automation.id,
          businessId,
          business_id: businessId,
          status: nextStatus,
          is_active: nextStatus === "active",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to update automation.");
      }

      setAutomations((current) =>
        current.map((item) =>
          item.id === automation.id
            ? normalizeAutomation(data.automation)
            : item
        )
      );

      setSuccess(
        nextStatus === "active" ? "Automation activated." : "Automation paused."
      );
    } catch (toggleError) {
      console.error(toggleError);
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update automation."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteAutomation(id: string) {
    try {
      setBusyId(id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/automations?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Failed to delete automation.");
      }

      setAutomations((current) => current.filter((item) => item.id !== id));
      setSuccess("Automation deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete automation."
      );
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Active</p>
          <p className="mt-2 text-3xl font-black text-emerald-300">
            {activeCount}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Paused</p>
          <p className="mt-2 text-3xl font-black text-zinc-300">
            {pausedCount}
          </p>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <p className="text-xs text-yellow-100/60">Pending Queue</p>
          <p className="mt-2 text-3xl font-black text-yellow-100">
            {pendingEvents.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-xs text-emerald-100/60">Sent</p>
          <p className="mt-2 text-3xl font-black text-emerald-100">
            {sentEvents.length}
          </p>
        </div>

        <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-5">
          <p className="text-xs text-red-100/60">Failed</p>
          <p className="mt-2 text-3xl font-black text-red-100">
            {failedEvents.length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-200">
              <Send className="h-3.5 w-3.5" />
              Manual Processor
            </div>

            <h2 className="mt-4 text-2xl font-black text-yellow-100">
              Process Pending Automations
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-yellow-100/70">
              Use this while testing before adding Vercel cron. Enter the same
              secret from your AUTOMATION_SECRET environment variable.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <input
              value={automationSecret}
              onChange={(event) => setAutomationSecret(event.target.value)}
              type="password"
              placeholder="AUTOMATION_SECRET"
              className="w-full rounded-2xl border border-yellow-400/20 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-yellow-100/30 focus:border-yellow-400/50 lg:w-72"
            />

            <button
              type="button"
              onClick={processAutomationEvents}
              disabled={processing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldCheck className="h-4 w-4" />
              )}
              Process Now
            </button>

            <button
              type="button"
              onClick={refreshAutomationEvents}
              disabled={eventBusyId === "refresh-events"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/20 bg-black/30 px-5 py-3 text-sm font-bold text-yellow-100 transition hover:bg-yellow-400/10 disabled:opacity-60"
            >
              {eventBusyId === "refresh-events" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh Queue
            </button>
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.45fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <Plus className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-bold">Create Automation</h2>
              <p className="text-sm text-zinc-500">
                Add a workflow for this business.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Automation name"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />

            <select
              value={type}
              onChange={(event) => setType(event.target.value as AutomationType)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
            >
              {automationTypes.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What should this automation do?"
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />

            <input
              value={trigger}
              onChange={(event) => setTrigger(event.target.value)}
              placeholder="Trigger example: New lead submitted"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />

            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="Action example: Send follow-up email"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />

            <button
              type="button"
              onClick={() => createAutomation()}
              disabled={saving || !name.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              Create Automation
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Wand2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-bold">Starter Automations</h2>
                <p className="text-sm text-zinc-500">
                  Install ready-made workflows.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {templates.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => createAutomation(item)}
                  disabled={saving}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-yellow-400/40 hover:bg-yellow-400/5 disabled:opacity-60"
                >
                  <p className="text-sm font-bold">{item.title}</p>
                  <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
                    {item.trigger} → {item.action}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-bold">Installed Automations</h2>
                <p className="text-sm text-zinc-500">
                  Manage workflows connected to this business.
                </p>
              </div>

              <div className="flex gap-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:w-52"
                  />
                </div>

                <button
                  type="button"
                  onClick={refreshAutomations}
                  disabled={busyId === "refresh"}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200 disabled:opacity-60"
                >
                  Refresh
                </button>

                <Bot className="hidden h-5 w-5 text-yellow-200 md:block" />
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredAutomations.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
                  <CalendarClock className="mx-auto h-8 w-8 text-zinc-600" />
                  <h3 className="mt-4 font-bold">No automations found</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    Create your first automation or install one of the starter
                    workflows above.
                  </p>
                </div>
              ) : (
                filteredAutomations.map((automation) => {
                  const isBusy = busyId === automation.id;

                  return (
                    <div
                      key={automation.id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{automation.name}</h3>

                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-yellow-200">
                              {automation.type || "sales"}
                            </span>

                            <span
                              className={
                                automation.status === "active"
                                  ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300"
                                  : "rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400"
                              }
                            >
                              {automation.status}
                            </span>
                          </div>

                          {automation.description ? (
                            <p className="mt-2 text-sm leading-6 text-zinc-400">
                              {automation.description}
                            </p>
                          ) : null}

                          <div className="mt-4 grid gap-3 text-xs text-zinc-500 md:grid-cols-2">
                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="font-bold text-zinc-300">Trigger</p>
                              <p className="mt-1">
                                {automation.trigger || "Not set"}
                              </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                              <p className="font-bold text-zinc-300">Action</p>
                              <p className="mt-1">
                                {automation.action || "Not set"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 sm:flex-col">
                          <button
                            type="button"
                            onClick={() => toggleAutomation(automation)}
                            disabled={isBusy}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-yellow-400/30 hover:text-yellow-200 disabled:opacity-60 sm:flex-none"
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : automation.status === "active" ? (
                              <Power className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            {automation.status === "active"
                              ? "Pause"
                              : "Activate"}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteAutomation(automation.id)}
                            disabled={isBusy}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs font-bold text-red-300 transition hover:border-red-400/30 disabled:opacity-60 sm:flex-none"
                          >
                            {isBusy ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Automation Event Queue</h2>
            <p className="text-sm text-zinc-500">
              View, retry, cancel, and mark pending funnel follow-ups.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={eventQuery}
                onChange={(event) => setEventQuery(event.target.value)}
                placeholder="Search events..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:w-60"
              />
            </div>

            <button
              type="button"
              onClick={refreshAutomationEvents}
              disabled={eventBusyId === "refresh-events"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200 disabled:opacity-60"
            >
              {eventBusyId === "refresh-events" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filteredAutomationEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
              <Clock className="mx-auto h-8 w-8 text-zinc-600" />
              <h3 className="mt-4 font-bold">No automation events found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Submit a funnel form to create pending follow-up and internal
                notification events.
              </p>
            </div>
          ) : (
            filteredAutomationEvents.map((event) => {
              const isBusy = eventBusyId === event.id;

              return (
                <div
                  key={event.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">
                          {event.subject || "Automation Event"}
                        </h3>

                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${getEventStatusClass(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </span>

                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                          {formatEventType(event.event_type)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-400">
                        {event.recipient_email ? (
                          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                            <Mail className="h-4 w-4 text-yellow-200" />
                            {event.recipient_email}
                          </span>
                        ) : null}

                        {event.recipient_name ? (
                          <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                            {event.recipient_name}
                          </span>
                        ) : null}

                        <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          Scheduled {formatDate(event.scheduled_for)}
                        </span>

                        <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                          Attempts {event.attempts ?? 0}
                        </span>
                      </div>

                      {event.message ? (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                          {event.message}
                        </p>
                      ) : null}

                      {event.last_error ? (
                        <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm leading-6 text-red-300">
                          <span className="font-black">Error:</span>{" "}
                          {event.last_error}
                        </div>
                      ) : null}

                      {event.sent_at ? (
                        <p className="mt-3 text-xs text-emerald-300">
                          Sent {formatDate(event.sent_at)}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">
                      {event.status === "failed" ||
                      event.status === "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => retryAutomationEvent(event)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-200 transition hover:bg-yellow-400/20 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCcw className="h-4 w-4" />
                          )}
                          Retry
                        </button>
                      ) : null}

                      {event.status !== "sent" ? (
                        <button
                          type="button"
                          onClick={() => markAutomationEventSent(event)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-400/20 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Mark Sent
                        </button>
                      ) : null}

                      {event.status === "pending" ||
                      event.status === "processing" ? (
                        <button
                          type="button"
                          onClick={() => cancelAutomationEvent(event)}
                          disabled={isBusy}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-400/20 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="h-4 w-4" />
                          )}
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}