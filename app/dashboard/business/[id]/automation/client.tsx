"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Plus,
  Power,
  Trash2,
  Wand2,
  Zap,
} from "lucide-react";

type AutomationStatus = "active" | "paused";
type AutomationType = "sales" | "marketing" | "support" | "operations";

type Automation = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  type: AutomationType;
  status: AutomationStatus;
  trigger: string | null;
  action: string | null;
  created_at: string;
};

type Props = {
  businessId: string;
};

type StarterAutomation = {
  name: string;
  type: AutomationType;
  description: string;
  trigger: string;
  action: string;
};

const automationTypes: {
  value: AutomationType;
  label: string;
  description: string;
}[] = [
  {
    value: "sales",
    label: "Sales",
    description: "Follow up with leads, abandoned checkouts, and buyers.",
  },
  {
    value: "marketing",
    label: "Marketing",
    description: "Create campaigns, emails, content, and promotions.",
  },
  {
    value: "support",
    label: "Support",
    description: "Respond to customers and answer common questions.",
  },
  {
    value: "operations",
    label: "Operations",
    description: "Handle reminders, tasks, files, and business workflows.",
  },
];

const starterAutomations: StarterAutomation[] = [
  {
    name: "New Lead Follow-Up",
    type: "sales",
    description: "Automatically follow up when someone submits a lead form.",
    trigger: "New lead submitted",
    action: "Send AI follow-up message",
  },
  {
    name: "Abandoned Checkout Recovery",
    type: "sales",
    description: "Recover customers who leave before completing checkout.",
    trigger: "Checkout started but not completed",
    action: "Send recovery email",
  },
  {
    name: "Weekly Marketing Ideas",
    type: "marketing",
    description: "Generate new campaign ideas every week for this business.",
    trigger: "Every Monday",
    action: "Generate marketing ideas",
  },
];

export default function BusinessAutomationsClient({ businessId }: Props) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [type, setType] = useState<AutomationType>("sales");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState("");
  const [action, setAction] = useState("");

  const activeCount = useMemo(() => {
    return automations.filter((automation) => automation.status === "active")
      .length;
  }, [automations]);

  const pausedCount = useMemo(() => {
    return automations.filter((automation) => automation.status === "paused")
      .length;
  }, [automations]);

  const loadAutomations = useCallback(
    async (options?: { showLoader?: boolean }) => {
      if (!businessId) {
        setAutomations([]);
        setLoading(false);
        return;
      }

      try {
        if (options?.showLoader) {
          setLoading(true);
        }

        const res = await fetch(`/api/automations?businessId=${businessId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load automations");
        }

        const data = await res.json();

        setAutomations(Array.isArray(data.automations) ? data.automations : []);
      } catch (error) {
        console.error(error);
        setAutomations([]);
      } finally {
        setLoading(false);
      }
    },
    [businessId]
  );

  useEffect(() => {
    let cancelled = false;

    async function runInitialLoad() {
      if (!businessId) {
        if (!cancelled) {
          setAutomations([]);
          setLoading(false);
        }

        return;
      }

      try {
        const res = await fetch(`/api/automations?businessId=${businessId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load automations");
        }

        const data = await res.json();

        if (!cancelled) {
          setAutomations(Array.isArray(data.automations) ? data.automations : []);
        }
      } catch (error) {
        console.error(error);

        if (!cancelled) {
          setAutomations([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void runInitialLoad();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  async function createAutomation(payload?: StarterAutomation) {
    const automationName = payload?.name ?? name;
    const automationType = payload?.type ?? type;
    const automationDescription = payload?.description ?? description;
    const automationTrigger = payload?.trigger ?? trigger;
    const automationAction = payload?.action ?? action;

    if (!automationName.trim() || saving) return;

    try {
      setSaving(true);

      const res = await fetch("/api/automations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: businessId,
          name: automationName.trim(),
          type: automationType,
          description: automationDescription.trim(),
          trigger: automationTrigger.trim(),
          action: automationAction.trim(),
          status: "active",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create automation");
      }

      setName("");
      setType("sales");
      setDescription("");
      setTrigger("");
      setAction("");

      await loadAutomations();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  async function toggleAutomation(automation: Automation) {
    const nextStatus: AutomationStatus =
      automation.status === "active" ? "paused" : "active";

    const previousAutomations = automations;

    setAutomations((current) =>
      current.map((item) =>
        item.id === automation.id ? { ...item, status: nextStatus } : item
      )
    );

    try {
      const res = await fetch("/api/automations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: automation.id,
          business_id: businessId,
          status: nextStatus,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update automation");
      }
    } catch (error) {
      console.error(error);
      setAutomations(previousAutomations);
    }
  }

  async function deleteAutomation(id: string) {
    const previousAutomations = automations;

    setAutomations((current) => current.filter((item) => item.id !== id));

    try {
      const res = await fetch("/api/automations", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          business_id: businessId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to delete automation");
      }
    } catch (error) {
      console.error(error);
      setAutomations(previousAutomations);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Link
                href={`/dashboard/businesses/${businessId}`}
                className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to business
              </Link>

              <div className="inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                Automation Engine
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Business Automations
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Build automated workflows for sales, marketing, support, and
                operations so your business can keep moving even when you are
                offline.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-500">Active</p>
                <p className="mt-1 text-3xl font-black text-emerald-300">
                  {activeCount}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-zinc-500">Paused</p>
                <p className="mt-1 text-3xl font-black text-zinc-300">
                  {pausedCount}
                </p>
              </div>
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
                onChange={(event) =>
                  setType(event.target.value as AutomationType)
                }
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
                {starterAutomations.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => createAutomation(item)}
                    disabled={saving}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4 text-left transition hover:border-yellow-400/40 hover:bg-yellow-400/5 disabled:opacity-60"
                  >
                    <p className="text-sm font-bold">{item.name}</p>
                    <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold">Installed Automations</h2>
                  <p className="text-sm text-zinc-500">
                    Manage workflows connected to this business.
                  </p>
                </div>

                <Bot className="h-5 w-5 text-yellow-200" />
              </div>

              <div className="mt-5 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-black/30 py-12 text-zinc-500">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading automations...
                  </div>
                ) : automations.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
                    <CalendarClock className="mx-auto h-8 w-8 text-zinc-600" />
                    <h3 className="mt-4 font-bold">No automations yet</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                      Create your first automation or install one of the starter
                      workflows above.
                    </p>
                  </div>
                ) : (
                  automations.map((automation) => (
                    <div
                      key={automation.id}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold">{automation.name}</h3>

                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-yellow-200">
                              {automation.type}
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
                            onClick={() => toggleAutomation(automation)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-yellow-400/30 hover:text-yellow-200 sm:flex-none"
                          >
                            {automation.status === "active" ? (
                              <Power className="h-4 w-4" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4" />
                            )}
                            {automation.status === "active"
                              ? "Pause"
                              : "Activate"}
                          </button>

                          <button
                            onClick={() => deleteAutomation(automation.id)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs font-bold text-red-300 transition hover:border-red-400/30 sm:flex-none"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}