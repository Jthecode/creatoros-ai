"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

type BusinessOptimizerButtonProps = {
  businessId: string;
  buttonLabel?: string;
  compact?: boolean;
  onOptimized?: (report: string) => void;
};

type OptimizerResponse = {
  success: boolean;
  report?: string;
  summary?: {
    revenue?: number;
    products?: number;
    leads?: number;
    orders?: number;
    aiAgents?: number;
    automations?: number;
    installedApps?: number;
    analyticsEvents?: number;
  };
  error?: string;
};

export default function BusinessOptimizerButton({
  businessId,
  buttonLabel = "Optimize My Business",
  compact = false,
  onOptimized,
}: BusinessOptimizerButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState("");
  const [summary, setSummary] = useState<OptimizerResponse["summary"] | null>(
    null
  );
  const [error, setError] = useState("");

  async function runOptimizer() {
    if (!businessId || loading) return;

    try {
      setLoading(true);
      setError("");
      setReport("");
      setSummary(null);

      const res = await fetch("/api/ai/business-optimizer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | OptimizerResponse
        | null;

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to run business optimizer.");
      }

      const optimizerReport = data.report || "";
      setReport(optimizerReport);
      setSummary(data.summary ?? null);
      onOptimized?.(optimizerReport);
    } catch (optimizerError) {
      console.error(optimizerError);
      setError(
        optimizerError instanceof Error
          ? optimizerError.message
          : "Unable to run business optimizer."
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    if (!report.trim()) return;

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (copyError) {
      console.error(copyError);
      setError("Could not copy report.");
    }
  }

  if (compact) {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={runOptimizer}
          disabled={loading || !businessId}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Optimizing..." : buttonLabel}
        </button>

        {error ? (
          <p className="mt-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
            <Wand2 className="h-6 w-6" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-black/30 px-3 py-1 text-xs font-bold text-yellow-100">
              <Sparkles className="h-3.5 w-3.5" />
              AI Business Optimizer
            </div>

            <h2 className="mt-4 text-2xl font-black text-yellow-100">
              Find the next best move
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-7 text-yellow-100/75">
              Analyze products, leads, orders, analytics, AI employees,
              automations, and marketplace apps to generate a growth report with
              a 7-day action plan.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={runOptimizer}
          disabled={loading || !businessId}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Optimizing..." : buttonLabel}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        </div>
      ) : null}

      {summary ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
            <p className="text-xs text-yellow-100/60">Revenue</p>
            <p className="mt-1 text-xl font-black text-yellow-100">
              ${Number(summary.revenue ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
            <p className="text-xs text-yellow-100/60">Products</p>
            <p className="mt-1 text-xl font-black text-yellow-100">
              {summary.products ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
            <p className="text-xs text-yellow-100/60">Leads</p>
            <p className="mt-1 text-xl font-black text-yellow-100">
              {summary.leads ?? 0}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
            <p className="text-xs text-yellow-100/60">Events</p>
            <p className="mt-1 text-xl font-black text-yellow-100">
              {summary.analyticsEvents ?? 0}
            </p>
          </div>
        </div>
      ) : null}

      {report ? (
        <div className="mt-5 rounded-3xl border border-white/10 bg-black/40 p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              <p className="text-sm font-black">Optimizer Report Ready</p>
            </div>

            <button
              type="button"
              onClick={copyReport}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
            >
              <Copy className="h-4 w-4" />
              {copied ? "Copied" : "Copy Report"}
            </button>
          </div>

          <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap break-words text-sm leading-7 text-zinc-200">
            {report}
          </pre>
        </div>
      ) : null}
    </div>
  );
}