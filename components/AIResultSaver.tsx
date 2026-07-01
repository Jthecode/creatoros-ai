"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Copy,
  Loader2,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";

type AIResultSaverProps = {
  businessId: string;
  module: string;
  prompt?: string;
  result: string;
  title?: string;
  description?: string;
  buttonLabel?: string;
  compact?: boolean;
  onSaved?: () => void;
};

export default function AIResultSaver({
  businessId,
  module,
  prompt = "",
  result,
  title = "Save AI Result",
  description = "Save this AI-generated output to this business so you can reuse it later.",
  buttonLabel = "Save Result",
  compact = false,
  onSaved,
}: AIResultSaverProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const canSave = Boolean(businessId && module && result.trim());

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (copyError) {
      console.error(copyError);
      setError("Could not copy result.");
    }
  }

  async function handleSave() {
    if (!canSave || saving) return;

    try {
      setSaving(true);
      setError("");
      setSaved(false);

      const res = await fetch("/api/ai-generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: businessId,
          module,
          prompt,
          result,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Failed to save AI result");
      }

      setSaved(true);
      onSaved?.();

      window.setTimeout(() => {
        setSaved(false);
      }, 2200);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save AI result"
      );
    } finally {
      setSaving(false);
    }
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!result.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied" : "Copy"}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave || saving}
          className={
            saved
              ? "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-300"
              : "inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 text-xs font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
          }
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : saved ? "Saved" : buttonLabel}
        </button>

        {error ? (
          <p className="text-xs font-medium text-red-300">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <Wand2 className="h-5 w-5" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
              <Sparkles className="h-3.5 w-3.5" />
              AI Output
            </div>

            <h3 className="mt-3 text-lg font-black text-white">{title}</h3>

            <p className="mt-1 max-w-xl text-sm leading-6 text-zinc-400">
              {description}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:min-w-[180px]">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!result.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy Result"}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || saving}
            className={
              saved
                ? "inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2.5 text-xs font-black text-emerald-300"
                : "inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-xs font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
            }
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saving ? "Saving..." : saved ? "Saved" : buttonLabel}
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">
          Module: {module}
        </p>

        <pre className="max-h-[360px] overflow-auto whitespace-pre-wrap break-words text-sm leading-6 text-zinc-200">
          {result || "No AI result generated yet."}
        </pre>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-300">
          {error}
        </div>
      ) : null}
    </div>
  );
}