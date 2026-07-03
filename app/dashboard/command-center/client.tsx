"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardList,
  Globe,
  Loader2,
  Megaphone,
  Package,
  Rocket,
  Send,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";

type Business = {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

type CommandAction = {
  type: string;
  label: string;
  status: string;
  message: string;
};

type CommandRun = {
  id: string;
  business_id: string;
  user_prompt: string;
  status: string;
  actions: CommandAction[];
  result: {
    summary?: string;
    recommendedNextMove?: string;
  } | null;
  created_at: string;
};

type Props = {
  business: Business;
  history: CommandRun[];
};

const prompts = [
  "Build a full website for this business",
  "Create a homepage, about page, services page, FAQ, and contact page",
  "Launch a new product for this business",
  "Build a 30-day marketing campaign",
  "Improve my storefront so it converts better",
  "Create an AI sales employee",
  "Set up follow-up automations for new leads",
  "Give me the next best move for this business",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getActionIcon(type: string) {
  if (type === "product") return Package;
  if (type === "automation") return Workflow;
  if (type === "ai_agent") return Bot;
  if (type === "marketing") return Megaphone;
  if (type === "website" || type === "storefront") return Globe;
  return ClipboardList;
}

export default function CommandCenterClient({ business, history }: Props) {
  const [input, setInput] = useState("");
  const [runs, setRuns] = useState<CommandRun[]>(history);
  const [latestActions, setLatestActions] = useState<CommandAction[]>([]);
  const [summary, setSummary] = useState("");
  const [nextMove, setNextMove] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () => input.trim().length > 0 && !loading,
    [input, loading]
  );

  async function runCommand(prompt?: string) {
    const commandPrompt = (prompt ?? input).trim();

    if (!commandPrompt || loading) return;

    try {
      setLoading(true);
      setError("");
      setSummary("");
      setNextMove("");
      setLatestActions([]);

      const res = await fetch("/api/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          prompt: commandPrompt,
          mode: "plan",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to run command.");
      }

      setLatestActions(data.result?.actions ?? []);
      setSummary(data.result?.summary ?? "Command plan created.");
      setNextMove(data.result?.recommendedNextMove ?? "");
      setRuns((current) => [data.commandRun, ...current]);
      setInput("");
    } catch (commandError) {
      console.error(commandError);
      setError(
        commandError instanceof Error
          ? commandError.message
          : "Unable to run command."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                <Sparkles className="h-3.5 w-3.5" />
                AI Command Center
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Run {business.name} from one AI command.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                Tell CreatorOS what to build, launch, fix, automate, or grow.
                The AI turns your command into website, product, marketing,
                storefront, automation, and AI employee actions.
              </p>

              <div className="mt-6 grid gap-3 text-sm text-zinc-400 md:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs text-zinc-500">Industry</p>
                  <p className="mt-1 font-bold text-white">
                    {business.industry || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs text-zinc-500">Audience</p>
                  <p className="mt-1 font-bold text-white">
                    {business.audience || "Not set"}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs text-zinc-500">Commands Run</p>
                  <p className="mt-1 font-bold text-white">{runs.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
            {error}
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <Bot className="h-5 w-5" />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-black">What should CreatorOS do?</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Example: “Build a full website and launch campaign for my
                business.”
              </p>

              <div className="mt-5 flex flex-col gap-3 md:flex-row">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your command..."
                  rows={4}
                  className="min-h-[120px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
                />

                <button
                  type="button"
                  onClick={() => runCommand()}
                  disabled={!canSubmit}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60 md:w-44"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Run Command
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => runCommand(prompt)}
              disabled={loading}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200 disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>

        {summary || latestActions.length > 0 ? (
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Zap className="h-5 w-5 text-yellow-200" />
              <h2 className="text-2xl font-black text-yellow-100">
                AI Action Plan
              </h2>
            </div>

            {summary ? (
              <p className="text-sm leading-7 text-yellow-100/75">{summary}</p>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {latestActions.map((action, index) => {
                const Icon = getActionIcon(action.type);

                return (
                  <div
                    key={`${action.type}-${index}`}
                    className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-yellow-200" />
                      <h3 className="font-black text-yellow-100">
                        {action.label}
                      </h3>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-yellow-100/70">
                      {action.message}
                    </p>
                  </div>
                );
              })}
            </div>

            {nextMove ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm font-black">Recommended Next Move</p>
                </div>

                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  {nextMove}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-xl font-black">Recent Commands</h2>

          {runs.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
              <Rocket className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-4 text-sm text-zinc-500">
                No command history yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {runs.slice(0, 10).map((run) => (
                <div
                  key={run.id}
                  className="rounded-2xl border border-white/10 bg-black/40 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-bold text-white">{run.user_prompt}</p>
                      <p className="mt-2 text-xs text-zinc-500">
                        {formatDate(run.created_at)}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold capitalize text-yellow-200">
                      {run.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}