"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Edit3,
  Loader2,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

type AIAgent = {
  id: string;
  business_id: string;
  name: string | null;
  role: string | null;
  opening_message: string | null;
  instructions: string | null;
  is_active: boolean | null;
  created_at: string;
};

type Props = {
  businessId: string;
  initialAgents: AIAgent[];
};

type FormState = {
  id: string;
  name: string;
  role: string;
  opening_message: string;
  instructions: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  role: "AI Sales Assistant",
  opening_message:
    "Hi! I’m your AI assistant. I can help answer questions, recommend products, and guide you to the right next step.",
  instructions:
    "Answer customer questions clearly, recommend the best products or services, collect lead information when needed, and help customers take action.",
  is_active: true,
};

const rolePresets = [
  "AI Sales Assistant",
  "AI Support Agent",
  "AI Lead Qualifier",
  "AI Onboarding Assistant",
  "AI Product Expert",
  "AI Marketing Assistant",
  "AI Business Operator",
];

function getAgentStatusClass(isActive: boolean | null) {
  if (isActive) {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-400";
}

export default function AIAgentsClient({ businessId, initialAgents }: Props) {
  const [agents, setAgents] = useState<AIAgent[]>(initialAgents);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const editing = Boolean(form.id);

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const search = query.toLowerCase();

      const matchesSearch =
        (agent.name ?? "").toLowerCase().includes(search) ||
        (agent.role ?? "").toLowerCase().includes(search) ||
        (agent.opening_message ?? "").toLowerCase().includes(search) ||
        (agent.instructions ?? "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? Boolean(agent.is_active)
            : !agent.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [agents, query, statusFilter]);

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
    setSuccess("");
  }

  function resetForm() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function editAgent(agent: AIAgent) {
    setForm({
      id: agent.id,
      name: agent.name ?? "",
      role: agent.role ?? "AI Sales Assistant",
      opening_message: agent.opening_message ?? "",
      instructions: agent.instructions ?? "",
      is_active: Boolean(agent.is_active),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveAgent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("AI employee name is required.");
      return;
    }

    if (!form.role.trim()) {
      setError("AI employee role is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/ai-agents", {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.id || undefined,
          businessId,
          name: form.name.trim(),
          role: form.role.trim(),
          openingMessage: form.opening_message.trim(),
          opening_message: form.opening_message.trim(),
          instructions: form.instructions.trim(),
          isActive: form.is_active,
          is_active: form.is_active,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save AI employee.");
      }

      const savedAgent = data.agent as AIAgent;

      setAgents((current) =>
        editing
          ? current.map((agent) =>
              agent.id === savedAgent.id ? savedAgent : agent
            )
          : [savedAgent, ...current]
      );

      setSuccess(editing ? "AI employee updated." : "AI employee created.");
      setForm(emptyForm);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save AI employee."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleAgent(agent: AIAgent) {
    try {
      setBusyId(agent.id);
      setError("");
      setSuccess("");

      const nextActive = !agent.is_active;

      const res = await fetch("/api/ai-agents", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: agent.id,
          businessId,
          isActive: nextActive,
          is_active: nextActive,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update AI employee.");
      }

      setAgents((current) =>
        current.map((item) =>
          item.id === agent.id ? (data.agent as AIAgent) : item
        )
      );

      setSuccess(nextActive ? "AI employee activated." : "AI employee paused.");
    } catch (toggleError) {
      console.error(toggleError);
      setError(
        toggleError instanceof Error
          ? toggleError.message
          : "Unable to update AI employee."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteAgent(agent: AIAgent) {
    try {
      setBusyId(agent.id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/ai-agents?id=${agent.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to delete AI employee.");
      }

      setAgents((current) => current.filter((item) => item.id !== agent.id));
      setSuccess("AI employee deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete AI employee."
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

      <form
        onSubmit={saveAgent}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black">
              {editing ? "Edit AI Employee" : "Create AI Employee"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Add AI staff for sales, support, onboarding, lead capture, and
              business operations.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="AI employee name"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <select
            value={form.role}
            onChange={(event) => updateForm("role", event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            {rolePresets.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <textarea
            value={form.opening_message}
            onChange={(event) =>
              updateForm("opening_message", event.target.value)
            }
            placeholder="Opening message"
            rows={3}
            className="resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 lg:col-span-2"
          />

          <textarea
            value={form.instructions}
            onChange={(event) => updateForm("instructions", event.target.value)}
            placeholder="AI instructions"
            rows={6}
            className="resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 lg:col-span-2"
          />
        </div>

        <button
          type="button"
          onClick={() => updateForm("is_active", !form.is_active)}
          className={
            form.is_active
              ? "mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300"
              : "mt-5 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-zinc-400"
          }
        >
          {form.is_active ? "Active on storefront" : "Inactive / paused"}
        </button>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {saving ? "Saving..." : editing ? "Update AI Employee" : "Create AI Employee"}
          </button>

          {editing ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-zinc-300"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Manage AI Employees</h2>
            <p className="text-sm text-zinc-500">
              Search, edit, activate, pause, or delete AI employees.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search AI employees..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 sm:w-72"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
            <Bot className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-black">No AI employees found</h3>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredAgents.map((agent) => {
              const isBusy = busyId === agent.id;

              return (
                <div
                  key={agent.id}
                  className="rounded-3xl border border-white/10 bg-black/40 p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                        <Bot className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-lg font-black">
                          {agent.name || "AI Employee"}
                        </h3>
                        <p className="mt-1 text-sm font-bold text-yellow-200">
                          {agent.role || "AI Sales Assistant"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getAgentStatusClass(
                        agent.is_active
                      )}`}
                    >
                      {agent.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                        <MessageCircle className="h-3.5 w-3.5" />
                        Opening Message
                      </div>

                      <p className="line-clamp-4 text-sm leading-6 text-zinc-400">
                        {agent.opening_message ||
                          "No opening message saved yet."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
                        <Sparkles className="h-3.5 w-3.5" />
                        Instructions
                      </div>

                      <p className="line-clamp-5 text-sm leading-6 text-zinc-400">
                        {agent.instructions ||
                          "No instructions saved for this AI employee yet."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => editAgent(agent)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAgent(agent)}
                      disabled={isBusy}
                      className={
                        agent.is_active
                          ? "inline-flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200 disabled:opacity-60"
                          : "inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300 disabled:opacity-60"
                      }
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4" />
                      )}
                      {agent.is_active ? "Pause" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteAgent(agent)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 disabled:opacity-60"
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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}