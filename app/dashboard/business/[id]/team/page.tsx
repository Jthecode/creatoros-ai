import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Crown,
  Mail,
  Plus,
  Shield,
  Sparkles,
  UserPlus,
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
  description: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id,name,description")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Business;
}

const teamMembers = [
  {
    name: "Business Owner",
    role: "Owner",
    email: "owner@example.com",
    icon: Crown,
  },
  {
    name: "AI Sales Employee",
    role: "AI Employee",
    email: "ai-sales@creatoros.ai",
    icon: Bot,
  },
];

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

export default async function TeamPage({
  params,
}: Props) {
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
            Team Management
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-8 text-zinc-300">
            Invite employees, virtual assistants, agencies, partners,
            and AI employees to help run your business.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">

            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <UserPlus size={18} />
              Invite Member
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 transition hover:border-yellow-400">
              <Sparkles size={18} />
              Create AI Employee
            </button>

          </div>

        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Team Members
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {teamMembers.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Bot className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              AI Employees
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              1
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Shield className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Permission Sets
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {permissions.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Mail className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Invitations
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>
          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-6 flex items-center gap-3">

              <Users className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                Team Members
              </h2>

            </div>

            <div className="space-y-4">

              {teamMembers.map((member) => {
                const Icon = member.icon;

                return (
                  <div
                    key={member.name}
                    className="rounded-2xl border border-white/10 bg-black/40 p-5"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                        <Icon size={22} />
                      </div>

                      <div>

                        <h3 className="font-bold">
                          {member.name}
                        </h3>

                        <p className="text-sm text-yellow-400">
                          {member.role}
                        </p>

                        <p className="text-sm text-zinc-500">
                          {member.email}
                        </p>

                      </div>

                    </div>

                  </div>
                );
              })}

            </div>

          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-6 flex items-center gap-3">

              <Shield className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                Role Permissions
              </h2>

            </div>

            <div className="space-y-3">

              {permissions.map((permission) => (

                <div
                  key={permission}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4"
                >

                  <span>{permission}</span>

                  <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-400">
                    Enabled
                  </span>

                </div>

              ))}

            </div>

          </div>

        </div>

        <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8">

          <div className="flex items-center gap-3">

            <Sparkles className="text-yellow-400" />

            <h2 className="text-2xl font-bold">
              AI Workforce Manager
            </h2>

          </div>

          <p className="mt-5 leading-8 text-zinc-300">
            CreatorOS AI will allow you to hire human employees,
            agencies, freelancers, virtual assistants, and AI employees.
            Every member will have custom permissions, activity logs,
            department assignments, and AI-assisted productivity insights.
          </p>

          <button className="mt-8 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
            Build My AI Workforce
          </button>

        </div>

      </section>
    </main>
  );
}