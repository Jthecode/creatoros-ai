import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Brain,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import AIAgentsClient from "./client";

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

async function loadAIAgentsPage(id: string) {
  const [businessResult, agentsResult, conversationsResult] =
    await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id, name, description")
        .eq("id", id)
        .single(),

      supabaseAdmin
        .from("ai_agents")
        .select("*")
        .eq("business_id", id)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("conversations")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id),
    ]);

  if (businessResult.error || !businessResult.data) return null;
  if (agentsResult.error) throw agentsResult.error;
  if (conversationsResult.error) throw conversationsResult.error;

  return {
    business: businessResult.data as Business,
    agents: (agentsResult.data ?? []) as AIAgent[],
    conversationsCount: conversationsResult.count ?? 0,
  };
}

export default async function AIAgentsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadAIAgentsPage(id);

  if (!data) notFound();

  const { business, agents, conversationsCount } = data;

  const activeAgents = agents.filter((agent) => agent.is_active);
  const inactiveAgents = agents.filter((agent) => !agent.is_active);

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
                  <Bot className="h-3.5 w-3.5" />
                  AI Employee Manager
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  AI Employees for {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Create and manage AI sales reps, support agents, onboarding
                  assistants, content helpers, and business operators.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#ai-agent-manager"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Sparkles className="h-4 w-4" />
                  New AI Employee
                </a>

                <Link
                  href={`/dashboard/business/${business.id}/conversations`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  Inbox
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">AI Employees</p>
            <h2 className="mt-2 text-3xl font-black">{agents.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <CheckCircle2 className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Active</p>
            <h2 className="mt-2 text-3xl font-black">
              {activeAgents.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Zap className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Inactive</p>
            <h2 className="mt-2 text-3xl font-black">
              {inactiveAgents.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <MessageCircle className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Conversations</p>
            <h2 className="mt-2 text-3xl font-black">
              {conversationsCount}
            </h2>
          </div>
        </div>

        <div id="ai-agent-manager">
          <AIAgentsClient businessId={business.id} initialAgents={agents} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Brain className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">AI Training System</h2>
            </div>

            <p className="text-sm leading-7 text-zinc-400">
              AI employees can be trained with business descriptions, products,
              FAQs, policies, uploaded files, customer conversations, sales
              scripts, and storefront goals.
            </p>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Users className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black text-yellow-100">
                AI Workforce Engine
              </h2>
            </div>

            <p className="text-sm leading-7 text-yellow-100/75">
              CreatorOS AI is being built to let each business hire multiple AI
              employees across sales, support, marketing, onboarding, CRM,
              fulfillment, and operations.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}