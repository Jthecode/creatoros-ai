import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  DollarSign,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  User,
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
};

type Customer = {
  id: string;
  customer_email: string | null;
  total_cents: number | null;
  status: string | null;
  created_at: string;
};

async function loadCRM(id: string) {
  const [businessResult, ordersResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id,name")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("orders")
      .select("*")
      .eq("business_id", id)
      .order("created_at", {
        ascending: false,
      }),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  return {
    business: businessResult.data as Business,
    customers: (ordersResult.data ?? []) as Customer[],
  };
}

function formatMoney(cents: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

export default async function CRMPage({
  params,
}: Props) {
  const { id } = await params;

  const data = await loadCRM(id);

  if (!data) {
    notFound();
  }

  const { business, customers } = data;

  const revenue = customers.reduce(
    (sum, customer) => sum + Number(customer.total_cents ?? 0),
    0
  );

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">

        <Link
          href={`/dashboard/business/${business.id}`}
          className="mb-8 inline-flex items-center gap-2 text-yellow-400"
        >
          <ArrowLeft size={18} />
          Back to Business
        </Link>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8">

          <p className="uppercase tracking-[0.35em] text-sm text-yellow-400">
            AI CRM
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            {business.name} CRM
          </h1>

          <p className="mt-5 max-w-3xl text-zinc-300">
            Manage leads, customers, purchases, conversations, AI summaries,
            lifetime value, and follow-ups.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">

            <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black flex items-center gap-2">
              <Plus size={18} />
              Add Customer
            </button>

            <button className="rounded-2xl border border-white/10 px-6 py-3 flex items-center gap-2">
              <Bot size={18} />
              AI Analyze CRM
            </button>

          </div>

        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Customers
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {customers.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <DollarSign className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Revenue
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              {formatMoney(revenue)}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <MessageCircle className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Conversations
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Bot className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              AI Insights
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              Ready
            </h2>
          </div>

        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">

          <div className="mb-6 flex items-center justify-between">

            <div className="flex items-center gap-3">

              <Users className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                Customer Database
              </h2>

            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2">

              <Search size={18} />

              <span className="text-sm text-zinc-500">
                Search...
              </span>

            </div>

          </div>

          {customers.length === 0 ? (

            <div className="rounded-2xl border border-white/10 bg-black/30 p-8 text-center">

              <Users
                size={60}
                className="mx-auto text-yellow-400"
              />

              <h3 className="mt-5 text-2xl font-bold">
                No Customers Yet
              </h3>

              <p className="mt-3 text-zinc-400">
                Customers will automatically appear after purchases.
              </p>

            </div>

          ) : (

            <div className="space-y-4">

              {customers.map((customer) => (

                <div
                  key={customer.id}
                  className="rounded-3xl border border-white/10 bg-black/30 p-6"
                >

                  <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">

                    <div>

                      <div className="flex items-center gap-3">

                        <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-400">

                          <User size={20} />

                        </div>

                        <div>

                          <h3 className="font-bold">
                            {customer.customer_email}
                          </h3>

                          <p className="text-sm text-zinc-500 capitalize">
                            {customer.status}
                          </p>

                        </div>

                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">

                        <button className="rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
                          <Mail size={16} />
                          Email
                        </button>

                        <button className="rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
                          <Phone size={16} />
                          Call
                        </button>

                        <button className="rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
                          <MessageCircle size={16} />
                          Chat
                        </button>

                      </div>

                    </div>

                    <div className="text-right">

                      <p className="text-sm text-zinc-500">
                        Lifetime Value
                      </p>

                      <h2 className="mt-2 text-3xl font-bold text-yellow-400">
                        {formatMoney(customer.total_cents)}
                      </h2>

                    </div>

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