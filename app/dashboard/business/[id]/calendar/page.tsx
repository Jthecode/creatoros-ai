import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Plus,
  Sparkles,
  Users,
  Video,
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
  description: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name, description")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as BusinessRow;
}

const bookingTypes = [
  "Discovery Call",
  "Coaching Session",
  "Strategy Call",
  "Consultation",
  "VIP Session",
  "Group Call",
];

export default async function CalendarPage({ params }: Props) {
  const { id } = await params;
  const business = await loadBusiness(id);

  if (!business) {
    notFound();
  }

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

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">
            AI Calendar
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Bookings for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Manage appointments, coaching calls, consultations, events, and AI
            scheduling workflows from one place.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Plus size={18} />
              New Booking Type
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <Sparkles size={18} />
              AI Build Schedule
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <CalendarDays className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Bookings</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Clock className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Available Slots</p>
            <h2 className="mt-2 text-3xl font-bold">Ready</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Attendees</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Video className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Video Calls</p>
            <h2 className="mt-2 text-3xl font-bold">Ready</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <CalendarDays className="text-yellow-400" />
              <h2 className="text-2xl font-bold">Booking Types</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {bookingTypes.map((type) => (
                <button
                  key={type}
                  className="rounded-3xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-yellow-400/50"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                    <Clock size={22} />
                  </div>

                  <h3 className="text-lg font-bold">{type}</h3>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    Create availability, pricing, intake questions, and booking
                    rules for this session type.
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <h2 className="text-2xl font-bold">AI Scheduling Assistant</h2>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              CreatorOS AI will help schedule appointments, prevent conflicts,
              send reminders, collect intake answers, and follow up after calls.
            </p>

            <button className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300">
              Configure Assistant
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}