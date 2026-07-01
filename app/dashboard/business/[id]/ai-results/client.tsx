"use client";

type AIGenerationRow = {
  id: string;
  business_id: string;
  module: string;
  prompt: string | null;
  result: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type Props = {
  businessId: string;
  initialResults: AIGenerationRow[];
};

export default function AIResultsClient({
  businessId,
  initialResults,
}: Props) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="text-xl font-black">AI Results</h2>
      <p className="mt-2 text-sm text-zinc-500">
        {initialResults.length} saved results for {businessId}
      </p>
    </div>
  );
}