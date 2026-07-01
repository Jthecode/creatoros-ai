import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Crown,
  Mail,
  Shield,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import TeamClient from "./client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Business = {
  id: string;
  name: string;
  description: string | null;
};

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

async function loadTeamPage(id: string) {
  const [businessResult, teamResult, agentsResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, description")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("team_members")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("ai_agents")
      .select("id")
      .eq("business_id", id)
      .eq("is_active", true),
  ]);

  if (businessResult.error || !businessResult.data) return null;
  if (teamResult.error) throw teamResult.error;
  if (agentsResult.error) throw agentsResult.error;

  return {
    business: businessResult.data as Business,
    teamMembers: (teamResult.data ?? []) as TeamMember[],
    activeAiAgents: agentsResult.data?.length ?? 0,
  };
}

const permissions = [
  "Manage Products",
  "Manage Orders",
  "Manage AI Employees",
  "Manage Marketing",
  "Manage Website",
  "Manage CRM",
  "View Analytics",
  "Manage Team",
];

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  const data = await loadTeamPage(id);

  if (!data) notFound();

  const { business, teamMembers, activeAiAgents } = data;

  const activeMembers = teamMembers.filter(
    (member) => member.status !== "removed"
  );

  const pendingInvites = teamMembers.filter(
    (member) => member.status === "invited" || member.status === "pending"
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
                  <Users className="h-3.5 w-3.5" />
                  Team Management
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {business.name} Team
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Invite employees, agencies, freelancers, virtual assistants,
                  partners, and AI employees to help run this CreatorOS AI
                  business.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#team-manager"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </a>

                <Link
                  href={`/dashboard/business/${business.id}/ai-agents`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Bot className="h-4 w-4" />
                  AI Employees
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Users className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Team Members</p>
            <h2 className="mt-2 text-3xl font-black">{activeMembers.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">AI Employees</p>
            <h2 className="mt-2 text-3xl font-black">{activeAiAgents}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Shield className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Permissions</p>
            <h2 className="mt-2 text-3xl font-black">{permissions.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Mail className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Invitations</p>
            <h2 className="mt-2 text-3xl font-black">
              {pendingInvites.length}
            </h2>
          </div>
        </div>

        <div id="team-manager">
          <TeamClient
            businessId={business.id}
            initialMembers={teamMembers}
            permissions={permissions}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <Crown className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Owner Access</h2>
            </div>

            <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5">
              <h3 className="font-black text-yellow-100">Business Owner</h3>
              <p className="mt-1 text-sm text-yellow-100/70">
                Full access to settings, products, orders, AI employees,
                analytics, storefront, and team permissions.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <Shield className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Role Permissions</h2>
            </div>

            <div className="space-y-3">
              {permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <span className="text-sm font-bold">{permission}</span>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                    Available
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black text-yellow-100">
                AI Workforce Manager
              </h2>

              <p className="mt-2 text-sm leading-7 text-yellow-100/75">
                CreatorOS AI can support human employees, agencies,
                freelancers, virtual assistants, and AI employees with custom
                permissions, team roles, and future activity logs.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}