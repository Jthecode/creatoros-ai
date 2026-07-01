"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  Package,
  Pause,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";

type InstalledAppStatus = "active" | "paused" | "removed";

type InstalledApp = {
  id: string;
  business_id: string;
  marketplace_app_id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: InstalledAppStatus;
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type InstalledAppsPanelProps = {
  businessId: string;
  initialApps?: InstalledApp[];
};

function getAppIcon(category: string) {
  if (category === "ai-modules" || category === "sales") return Bot;
  if (category === "automations" || category === "marketing") return Zap;
  return Package;
}

export default function InstalledAppsPanel({
  businessId,
  initialApps = [],
}: InstalledAppsPanelProps) {
  const [apps, setApps] = useState<InstalledApp[]>(initialApps);
  const [loading, setLoading] = useState(initialApps.length === 0);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const activeApps = useMemo(
    () => apps.filter((app) => app.status === "active"),
    [apps]
  );

  const pausedApps = useMemo(
    () => apps.filter((app) => app.status === "paused"),
    [apps]
  );

  async function loadApps(options?: { refreshing?: boolean }) {
    try {
      if (options?.refreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const res = await fetch(`/api/installed-apps?businessId=${businessId}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to load installed apps.");
      }

      setApps(Array.isArray(data.apps) ? data.apps : []);
    } catch (loadError) {
      console.error(loadError);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load installed apps."
      );
      setApps([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`/api/installed-apps?businessId=${businessId}`, {
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok || !data?.success) {
          throw new Error(data?.error || "Unable to load installed apps.");
        }

        if (!cancelled) {
          setApps(Array.isArray(data.apps) ? data.apps : []);
        }
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load installed apps."
          );
          setApps([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (businessId && initialApps.length === 0) {
      void run();
    }

    return () => {
      cancelled = true;
    };
  }, [businessId, initialApps.length]);

  async function updateAppStatus(app: InstalledApp, status: InstalledAppStatus) {
    try {
      setBusyId(app.id);
      setError("");

      const res = await fetch("/api/installed-apps", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: app.id,
          status,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update installed app.");
      }

      setApps((current) =>
        current.map((item) =>
          item.id === app.id ? (data.app as InstalledApp) : item
        )
      );
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update installed app."
      );
    } finally {
      setBusyId("");
    }
  }

  async function uninstallApp(app: InstalledApp) {
    try {
      setBusyId(app.id);
      setError("");

      const res = await fetch("/api/marketplace/uninstall", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: app.id,
          businessId,
          hardDelete: false,
          removeProvisionedResources: false,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to uninstall app.");
      }

      if (data.app) {
        setApps((current) =>
          current.map((item) =>
            item.id === app.id ? (data.app as InstalledApp) : item
          )
        );
      } else {
        setApps((current) => current.filter((item) => item.id !== app.id));
      }
    } catch (uninstallError) {
      console.error(uninstallError);
      setError(
        uninstallError instanceof Error
          ? uninstallError.message
          : "Unable to uninstall app."
      );
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-400">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-yellow-200" />
        Loading installed apps...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Installed</p>
          <p className="mt-2 text-3xl font-black">{apps.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Active</p>
          <p className="mt-2 text-3xl font-black text-emerald-300">
            {activeApps.length}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Paused</p>
          <p className="mt-2 text-3xl font-black text-zinc-300">
            {pausedApps.length}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">Installed Apps</h2>
            <p className="text-sm text-zinc-500">
              Manage marketplace apps connected to this business.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadApps({ refreshing: true })}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
            <Sparkles className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-black">No apps installed yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
              Install apps from the CreatorOS AI Marketplace to add AI agents,
              automations, storefront upgrades, templates, and business tools.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {apps.map((app) => {
              const Icon = getAppIcon(app.category);
              const isBusy = busyId === app.id;

              return (
                <div
                  key={app.id}
                  className="flex flex-col rounded-3xl border border-white/10 bg-black/40 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                      <Icon className="h-5 w-5" />
                    </div>

                    <span
                      className={
                        app.status === "active"
                          ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300"
                          : app.status === "paused"
                            ? "rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-zinc-300"
                            : "rounded-full border border-red-400/20 bg-red-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-red-300"
                      }
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="mt-5 flex-1">
                    <h3 className="text-lg font-black">{app.title}</h3>

                    <p className="mt-2 line-clamp-4 text-sm leading-6 text-zinc-400">
                      {app.description || "Marketplace app installed."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-zinc-400">
                        {app.category}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-zinc-400">
                        {app.marketplace_app_id}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-2 border-t border-white/10 pt-4">
                    {app.status === "active" ? (
                      <button
                        type="button"
                        onClick={() => updateAppStatus(app, "paused")}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200 disabled:opacity-60"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Pause className="h-4 w-4" />
                        )}
                        Pause App
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateAppStatus(app, "active")}
                        disabled={isBusy}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300 transition hover:border-emerald-400/40 disabled:opacity-60"
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4" />
                        )}
                        Activate App
                      </button>
                    )}

                    <button
                      type="button"
                      disabled
                      className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-zinc-600"
                    >
                      <Settings className="h-4 w-4" />
                      Settings Soon
                    </button>

                    <button
                      type="button"
                      onClick={() => uninstallApp(app)}
                      disabled={isBusy || app.status === "removed"}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:border-red-400/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove App
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