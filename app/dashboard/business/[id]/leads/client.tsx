"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";

type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

type Lead = {
  id: string;
  business_id: string;
  businessId?: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  status: LeadStatus | string | null;
  value: number | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Props = {
  businessId: string;
  initialLeads: Lead[];
};

type FormState = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: LeadStatus;
  value: string;
  notes: string;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "manual",
  status: "new",
  value: "",
  notes: "",
};

const statuses: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "won",
  "lost",
];

function formatCurrency(value: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function getStatusClass(status: string | null) {
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

export default function LeadsClient({ businessId, initialLeads }: Props) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const editing = Boolean(form.id);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const search = query.toLowerCase();

      const matchesSearch =
        (lead.name ?? "").toLowerCase().includes(search) ||
        (lead.email ?? "").toLowerCase().includes(search) ||
        (lead.phone ?? "").toLowerCase().includes(search) ||
        (lead.company ?? "").toLowerCase().includes(search) ||
        (lead.source ?? "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ? true : lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, query, statusFilter]);

  const pipeline = useMemo(() => {
    return statuses.map((status) => ({
      status,
      leads: leads.filter((lead) => (lead.status || "new") === status),
    }));
  }, [leads]);

  function resetForm() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function editLead(lead: Lead) {
    setForm({
      id: lead.id,
      name: lead.name ?? "",
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      company: lead.company ?? "",
      source: lead.source ?? "manual",
      status: (lead.status as LeadStatus) || "new",
      value: lead.value ? String(lead.value) : "",
      notes: lead.notes ?? "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() && !form.email.trim() && !form.phone.trim()) {
      setError("Lead name, email, or phone is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        id: form.id || undefined,
        businessId,
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        source: form.source.trim() || "manual",
        status: form.status,
        value: form.value ? Number(form.value) : 0,
        notes: form.notes.trim() || null,
      };

      const res = await fetch("/api/leads", {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save lead.");
      }

      const savedLead = data.lead as Lead;

      setLeads((current) =>
        editing
          ? current.map((lead) => (lead.id === savedLead.id ? savedLead : lead))
          : [savedLead, ...current]
      );

      setSuccess(editing ? "Lead updated." : "Lead created.");
      setForm(emptyForm);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save lead."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(lead: Lead, status: LeadStatus) {
    try {
      setBusyId(lead.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: lead.id,
          status,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update lead status.");
      }

      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? (data.lead as Lead) : item))
      );

      setSuccess(`Lead moved to ${status}.`);
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update lead status."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteLead(lead: Lead) {
    try {
      setBusyId(lead.id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/leads?id=${lead.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to delete lead.");
      }

      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setSuccess("Lead deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete lead."
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
        onSubmit={saveLead}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <Plus className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black">
              {editing ? "Edit Lead" : "Create Lead"}
            </h2>
            <p className="text-sm text-zinc-500">
              Add or update customer pipeline records.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Lead name"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.email}
            onChange={(event) =>
              setForm((current) => ({ ...current, email: event.target.value }))
            }
            placeholder="Email"
            type="email"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.phone}
            onChange={(event) =>
              setForm((current) => ({ ...current, phone: event.target.value }))
            }
            placeholder="Phone"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.company}
            onChange={(event) =>
              setForm((current) => ({ ...current, company: event.target.value }))
            }
            placeholder="Company"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.source}
            onChange={(event) =>
              setForm((current) => ({ ...current, source: event.target.value }))
            }
            placeholder="Source"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as LeadStatus,
              }))
            }
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <input
            value={form.value}
            onChange={(event) =>
              setForm((current) => ({ ...current, value: event.target.value }))
            }
            placeholder="Lead value"
            type="number"
            min="0"
            step="0.01"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:col-span-2"
          />

          <textarea
            value={form.notes}
            onChange={(event) =>
              setForm((current) => ({ ...current, notes: event.target.value }))
            }
            placeholder="Notes"
            rows={4}
            className="resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:col-span-2"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving ? "Saving..." : editing ? "Update Lead" : "Create Lead"}
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
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Lead Pipeline</h2>
            <p className="text-sm text-zinc-500">
              Kanban-style status overview.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search leads..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 sm:w-72"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-6">
          {pipeline.map((column) => (
            <div
              key={column.status}
              className="rounded-3xl border border-white/10 bg-black/30 p-4"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-black capitalize">
                  {column.status}
                </h3>
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-bold text-zinc-400">
                  {column.leads.length}
                </span>
              </div>

              <div className="space-y-3">
                {column.leads.slice(0, 6).map((lead) => (
                  <div
                    key={lead.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <p className="text-sm font-black">
                      {lead.name || "Unnamed lead"}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {lead.email || lead.phone || "No contact"}
                    </p>

                    <p className="mt-2 text-xs font-bold text-yellow-200">
                      {formatCurrency(lead.value)}
                    </p>
                  </div>
                ))}

                {column.leads.length === 0 ? (
                  <p className="rounded-2xl border border-dashed border-white/10 p-4 text-xs text-zinc-600">
                    No leads
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <h2 className="mb-5 text-xl font-black">Manage Leads</h2>

        {filteredLeads.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-black">No leads found</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredLeads.map((lead) => {
              const isBusy = busyId === lead.id;

              return (
                <div
                  key={lead.id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-black">
                        {lead.name || "Unnamed lead"}
                      </h3>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                          lead.status
                        )}`}
                      >
                        {lead.status || "new"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-400">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="inline-flex items-center gap-2 hover:text-yellow-200"
                        >
                          <Mail className="h-4 w-4" />
                          {lead.email}
                        </a>
                      ) : null}

                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="inline-flex items-center gap-2 hover:text-yellow-200"
                        >
                          <Phone className="h-4 w-4" />
                          {lead.phone}
                        </a>
                      ) : null}

                      {lead.company ? <span>{lead.company}</span> : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-zinc-500">
                      {lead.notes || "No notes saved."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => editLead(lead)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    <select
                      value={(lead.status as string) || "new"}
                      onChange={(event) =>
                        updateStatus(lead, event.target.value as LeadStatus)
                      }
                      disabled={isBusy}
                      className="rounded-xl border border-white/10 bg-black px-4 py-3 text-sm font-bold text-zinc-300 outline-none disabled:opacity-60"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteLead(lead)}
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