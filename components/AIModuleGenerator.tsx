"use client";

import { useState } from "react";
import { Loader2, Sparkles, Wand2 } from "lucide-react";

type ModuleType =
  | "products"
  | "marketing"
  | "content"
  | "branding"
  | "website"
  | "sales"
  | "crm"
  | "automation"
  | "finance";

type AIModuleResult = {
  moduleType: string;
  title: string;
  summary: string;
  recommendations: string[];
  generatedItems: unknown[];
  nextActions: string[];
};

type AIModuleGeneratorProps = {
  businessId: string;
  moduleType: ModuleType;
  title: string;
  description: string;
  placeholder?: string;
};

export default function AIModuleGenerator({
  businessId,
  moduleType,
  title,
  description,
  placeholder = "Tell CreatorOS AI exactly what you want...",
}: AIModuleGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIModuleResult | null>(null);

  async function generate() {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/ai/generate-module", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          moduleType,
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate.");
      }

      setResult(data.generated as AIModuleResult);
    } catch (error) {
      console.error(error);
      alert("Unable to generate.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          <Sparkles size={22} />
        </div>

        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-sm text-zinc-300">{description}</p>
        </div>
      </div>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder={placeholder}
        className="min-h-36 w-full rounded-2xl border border-white/10 bg-black/50 p-4 text-white outline-none transition focus:border-yellow-400"
      />

      <button
        onClick={generate}
        disabled={loading || !prompt.trim()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            CreatorOS AI Working...
          </>
        ) : (
          <>
            <Wand2 size={20} />
            Generate With AI
          </>
        )}
      </button>

      {result && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
          <h3 className="mb-3 text-xl font-bold text-yellow-400">
            AI Result
          </h3>

          <pre className="overflow-auto whitespace-pre-wrap text-sm leading-7 text-zinc-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}