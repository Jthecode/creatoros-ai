import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Crown,
  Lock,
  MessageSquare,
  Plus,
  Shield,
  Sparkles,
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
  description: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id,name,description")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Business;
}

const channels = [
  "Announcements",
  "General Chat",
  "Questions",
  "VIP Members",
  "Wins & Results",
  "Resources",
];

export default async function CommunityPage({
  params,
}: Props) {
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
            AI Community
          </p>

          <h1 className="mt-4 text-5xl font-bold">
            {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-8 text-zinc-300">
            Build a private community with memberships, discussions,
            live events, announcements, AI moderation,
            and premium content.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">

            <button className="rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black flex items-center gap-2">
              <Plus size={18} />
              Create Community
            </button>

            <button className="rounded-2xl border border-white/10 px-6 py-3 flex items-center gap-2">
              <Sparkles size={18} />
              AI Generate Structure
            </button>

          </div>

        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Members
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <MessageSquare className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Discussions
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Calendar className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              Events
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              0
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Shield className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">
              AI Moderation
            </p>
            <h2 className="mt-2 text-3xl font-bold">
              Ready
            </h2>
          </div>

        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-6 flex items-center gap-3">

              <MessageSquare className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                Community Channels
              </h2>

            </div>

            <div className="space-y-3">

              {channels.map((channel) => (

                <button
                  key={channel}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-yellow-400"
                >

                  {channel}

                  <MessageSquare
                    size={18}
                    className="text-yellow-400"
                  />

                </button>

              ))}

            </div>

          </div>

          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-white/[0.04] p-6">

            <div className="mb-6 flex items-center gap-3">

              <Crown className="text-yellow-400" />

              <h2 className="text-2xl font-bold">
                Membership Levels
              </h2>

            </div>

            <div className="grid gap-5 md:grid-cols-3">

              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">

                <Users
                  className="text-yellow-400 mb-4"
                  size={24}
                />

                <h3 className="text-xl font-bold">
                  Free
                </h3>

                <p className="mt-3 text-sm text-zinc-400">
                  Community access, announcements and public posts.
                </p>

              </div>

              <div className="rounded-3xl border border-yellow-400 bg-yellow-400/10 p-6">

                <Crown
                  className="text-yellow-400 mb-4"
                  size={24}
                />

                <h3 className="text-xl font-bold">
                  Premium
                </h3>

                <p className="mt-3 text-sm text-zinc-300">
                  Premium channels, live calls, downloads,
                  exclusive content and networking.
                </p>

              </div>

              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">

                <Lock
                  className="text-yellow-400 mb-4"
                  size={24}
                />

                <h3 className="text-xl font-bold">
                  VIP
                </h3>

                <p className="mt-3 text-sm text-zinc-400">
                  Private mastermind, AI coaching,
                  direct support and premium resources.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>
    </main>
  );
}