"use client";

import { useState } from "react";
import { CheckCircle2, Download, Loader2, Sparkles } from "lucide-react";

type MarketplaceInstallButtonProps = {
  businessId: string;
  marketplaceAppId: string;
  title: string;
  description?: string | null;
  category?: string;
  icon?: string | null;
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  buttonLabel?: string;
  installedLabel?: string;
  className?: string;
  onInstalled?: (app: unknown) => void;
};

export default function MarketplaceInstallButton({
  businessId,
  marketplaceAppId,
  title,
  description = null,
  category = "ai-modules",
  icon = null,
  settings = {},
  metadata = {},
  buttonLabel = "Install",
  installedLabel = "Installed",
  className = "",
  onInstalled,
}: MarketplaceInstallButtonProps) {
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [error, setError] = useState("");

  async function handleInstall() {
    if (!businessId || !marketplaceAppId) {
      setError("Missing install details.");
      return;
    }

    try {
      setInstalling(true);
      setError("");

      const res = await fetch("/api/marketplace/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          marketplaceAppId,
          title,
          description,
          category,
          icon,
          settings,
          metadata,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to install marketplace app.");
      }

      setInstalled(true);
      onInstalled?.(data.app);
    } catch (installError) {
      console.error(installError);
      setError(
        installError instanceof Error
          ? installError.message
          : "Unable to install marketplace app."
      );
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleInstall}
        disabled={installing || installed}
        className={
          className ||
          (installed
            ? "inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-black text-emerald-300"
            : "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60")
        }
      >
        {installing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : installed ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : buttonLabel.toLowerCase().includes("install") ? (
          <Download className="h-4 w-4" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}

        {installing ? "Installing..." : installed ? installedLabel : buttonLabel}
      </button>

      {error ? (
        <p className="mt-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}