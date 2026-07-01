"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Crown,
  Edit3,
  Loader2,
  Mail,
  Plus,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";

type TeamMember = {
  id: string;
  business_id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
  permissions: string[] | null;
  created_at: string;
};

type Props = {
  businessId: string;
  initialMembers: TeamMember[];
  permissions: string[];
};

type FormState = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  permissions: string[];
};

const emptyForm: FormState = {
  id: "",
  name: "",
  email: "",
  role: "member",
  status: "invited",
  permissions: ["View Analytics"],
};

const roles = ["owner", "admin", "manager", "member", "viewer"];
const statuses = ["active", "invited", "pending", "disabled", "removed"];

function getRoleClass(role: string | null) {
  if (role === "owner") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }

  if (role === "admin" || role === "manager") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function getStatusClass(status: string | null) {
  if (status === "active") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "invited" || status === "pending") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }

  if (status === "disabled" || status === "removed") {
    return "border-red-400/20 bg-red-400/10 text-red-300";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

export default function TeamClient({
  businessId,
  initialMembers,
  permissions,
}: Props) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const editing = Boolean(form.id);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const search = query.toLowerCase();

      const matchesSearch =
        (member.name ?? "").toLowerCase().includes(search) ||
        (member.email ?? "").toLowerCase().includes(search) ||
        (member.role ?? "").toLowerCase().includes(search);

      const matchesRole =
        roleFilter === "all" ? true : member.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ? true : member.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, query, roleFilter, statusFilter]);

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

  function togglePermission(permission: string) {
    setForm((current) => {
      const exists = current.permissions.includes(permission);

      return {
        ...current,
        permissions: exists
          ? current.permissions.filter((item) => item !== permission)
          : [...current.permissions, permission],
      };
    });

    setError("");
    setSuccess("");
  }

  function editMember(member: TeamMember) {
    setForm({
      id: member.id,
      name: member.name ?? "",
      email: member.email ?? "",
      role: member.role ?? "member",
      status: member.status ?? "active",
      permissions: Array.isArray(member.permissions)
        ? member.permissions
        : ["View Analytics"],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Member name is required.");
      return;
    }

    if (!form.email.trim()) {
      setError("Member email is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/team-members", {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: form.id || undefined,
          businessId,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          status: form.status,
          permissions: form.permissions,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save team member.");
      }

      const savedMember = data.member as TeamMember;

      setMembers((current) =>
        editing
          ? current.map((member) =>
              member.id === savedMember.id ? savedMember : member
            )
          : [savedMember, ...current]
      );

      setSuccess(editing ? "Team member updated." : "Team member invited.");
      setForm(emptyForm);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save team member."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateMemberStatus(member: TeamMember, status: string) {
    try {
      setBusyId(member.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/team-members", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: member.id,
          businessId,
          status,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update team member.");
      }

      setMembers((current) =>
        current.map((item) =>
          item.id === member.id ? (data.member as TeamMember) : item
        )
      );

      setSuccess(`Member marked ${status}.`);
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update team member."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteMember(member: TeamMember) {
    try {
      setBusyId(member.id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/team-members?id=${member.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to remove team member.");
      }

      setMembers((current) => current.filter((item) => item.id !== member.id));
      setSuccess("Team member removed.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to remove team member."
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
        onSubmit={saveMember}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
      >
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <UserPlus className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black">
              {editing ? "Edit Team Member" : "Invite Team Member"}
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Add team members and control what they can access.
            </p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) => updateForm("name", event.target.value)}
            placeholder="Full name"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.email}
            onChange={(event) => updateForm("email", event.target.value)}
            placeholder="Email address"
            type="email"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <select
            value={form.role}
            onChange={(event) => updateForm("role", event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <select
            value={form.status}
            onChange={(event) => updateForm("status", event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-yellow-200" />
            <p className="text-sm font-black">Permissions</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {permissions.map((permission) => {
              const active = form.permissions.includes(permission);

              return (
                <button
                  key={permission}
                  type="button"
                  onClick={() => togglePermission(permission)}
                  className={
                    active
                      ? "rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-left text-sm font-bold text-yellow-200"
                      : "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-left text-sm font-bold text-zinc-400 transition hover:border-yellow-400/30"
                  }
                >
                  {permission}
                </button>
              );
            })}
          </div>
        </div>

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
            {saving ? "Saving..." : editing ? "Update Member" : "Invite Member"}
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
            <h2 className="text-xl font-black">Manage Team</h2>
            <p className="text-sm text-zinc-500">
              Search, edit roles, update permissions, and remove members.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search team..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 sm:w-72"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>

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

        {filteredMembers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
            <Users className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-black">No team members found</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredMembers.map((member) => {
              const isBusy = busyId === member.id;

              return (
                <div
                  key={member.id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-5 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                        {member.role === "owner" ? (
                          <Crown className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-black">
                          {member.name || "Unnamed Member"}
                        </h3>

                        <p className="text-sm text-zinc-500">
                          {member.email || "No email"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getRoleClass(
                          member.role
                        )}`}
                      >
                        {member.role || "member"}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusClass(
                          member.status
                        )}`}
                      >
                        {member.status || "active"}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(member.permissions ?? []).slice(0, 6).map((permission) => (
                        <span
                          key={permission}
                          className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-400"
                        >
                          {permission}
                        </span>
                      ))}

                      {(member.permissions ?? []).length > 6 ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-500">
                          +{(member.permissions ?? []).length - 6} more
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                      >
                        <Mail className="h-4 w-4" />
                        Email
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => editMember(member)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    {member.status !== "disabled" ? (
                      <button
                        type="button"
                        onClick={() => updateMemberStatus(member, "disabled")}
                        disabled={isBusy}
                        className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200 disabled:opacity-60"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateMemberStatus(member, "active")}
                        disabled={isBusy}
                        className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300 disabled:opacity-60"
                      >
                        Enable
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteMember(member)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 disabled:opacity-60"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove
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