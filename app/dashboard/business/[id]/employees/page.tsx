import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  BriefcaseBusiness,
  MessageCircle,
  Plus,
  Power,
  Sparkles,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
};

type EmployeeRow = {
  id: string;
  name: string | null;
  role: string | null;
  opening_message: string | null;
  instructions: string | null;
  is_active: boolean | null;
  created_at: string;
};

async function loadEmployees(id: string) {
  const [businessResult, employeesResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", id)
      .single(),
    supabaseAdmin
      .from("ai_agents")
      .select("id, name, role, opening_message, instructions, is_active, created_at")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (employeesResult.error) throw employeesResult.error;

  return {
    business: businessResult.data as BusinessRow,
    employees: (employeesResult.data ?? []) as EmployeeRow[],
  };
}

export default async function EmployeesPage({ params }: Props) {
  const { id } = await params;
  const data = await loadEmployees(id);

  if (!data) {
    notFound();
  }

  const { business, employees } = data;

  const activeEmployees = employees.filter((employee) => employee.is_active);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="mb-8 inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
        >
          <ArrowLeft size={18} />
          Back to Business
        </Link>

        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">
              AI Employee Manager
            </p>

            <h1 className="mt-4 text-4xl font-bold md:text-6xl">
              {business.name} Employees
            </h1>

            <p className="mt-4 max-w-2xl text-zinc-300">
              Manage your AI sales, support, marketing, and business employees
              from one place.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl border border-yellow-400/40 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400/10">
              <Sparkles size={18} />
              AI Generate Employee
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Plus size={18} />
              New Employee
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Bot className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Total Employees</p>
            <h2 className="mt-2 text-3xl font-bold">{employees.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Power className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Active Employees</p>
            <h2 className="mt-2 text-3xl font-bold">
              {activeEmployees.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <MessageCircle className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Customer Conversations</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex items-center gap-3">
            <BriefcaseBusiness className="text-yellow-400" />
            <h2 className="text-2xl font-bold">Employee Roster</h2>
          </div>

          {employees.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6">
              <p className="text-zinc-400">
                No AI employees yet. Create your first AI employee to help sell,
                support, and grow this business.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {employees.map((employee) => (
                <div
                  key={employee.id}
                  className="rounded-3xl border border-white/10 bg-black/40 p-6"
                >
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                        <Bot size={22} />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold">
                          {employee.name || "CreatorOS AI Employee"}
                        </h3>

                        <p className="text-sm text-yellow-300">
                          {employee.role || "AI Sales Manager"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs ${
                        employee.is_active
                          ? "border-green-500/20 bg-green-500/10 text-green-300"
                          : "border-white/10 bg-white/[0.04] text-zinc-400"
                      }`}
                    >
                      {employee.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-zinc-300">
                    {employee.opening_message ||
                      "This employee is ready to help customers and support your business."}
                  </p>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.25em] text-yellow-400">
                      Instructions
                    </p>

                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-zinc-400">
                      {employee.instructions ||
                        "No instructions have been added yet."}
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <button className="rounded-2xl border border-white/10 px-4 py-3 font-bold text-white transition hover:border-yellow-400/50">
                      Edit
                    </button>

                    <button className="rounded-2xl bg-yellow-400 px-4 py-3 font-bold text-black transition hover:bg-yellow-300">
                      Train Employee
                    </button>
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