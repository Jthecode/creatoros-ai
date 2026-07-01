"use client";

import { useEffect, useState } from "react";

type BusinessStatsBarProps = {
  businessId: string;
};

type BusinessStats = {
  revenueFormatted: string;
  orders: number;
  customers: number;
  products: number;
  aiAgents: number;
  visitors: number;
  conversionRate: number;
  tasks: number;
};

const defaultStats: BusinessStats = {
  revenueFormatted: "$0",
  orders: 0,
  customers: 0,
  products: 0,
  aiAgents: 0,
  visitors: 0,
  conversionRate: 0,
  tasks: 0,
};

export default function BusinessStatsBar({
  businessId,
}: BusinessStatsBarProps) {
  const [stats, setStats] = useState<BusinessStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch(`/api/businesses/${businessId}/stats`);
        const data = await response.json();

        if (response.ok && data.stats) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Unable to load business stats:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [businessId]);

  const items = [
    ["Revenue", stats.revenueFormatted],
    ["Orders", stats.orders.toString()],
    ["Customers", stats.customers.toString()],
    ["Products", stats.products.toString()],
    ["AI Staff", stats.aiAgents.toString()],
    ["Visitors", stats.visitors.toString()],
    ["Conversion", `${stats.conversionRate}%`],
    ["Tasks", stats.tasks.toString()],
  ];

  return (
    <div className="grid grid-cols-2 border-t border-white/10 bg-white/[0.02] md:grid-cols-4 xl:grid-cols-8">
      {items.map(([label, value]) => (
        <div
          key={label}
          className="border-r border-white/10 px-6 py-5 last:border-r-0"
        >
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            {label}
          </p>

          <h3 className="mt-2 text-2xl font-bold">
            {loading ? "..." : value}
          </h3>
        </div>
      ))}
    </div>
  );
}