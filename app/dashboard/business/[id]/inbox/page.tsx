import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Inbox,
  Mail,
  MessageCircle,
  Send,
  Sparkles,
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

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id,name")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as Business;
}

const conversations = [
  {
    name: "Website Visitor",
    channel: "AI Chat",
    message: "I’m interested in your best package.",
    status: "New",
    icon: Bot,
  },
  {
    name: "Customer Lead",
    channel: "Email",
    message: "Can you send more info about pricing?",
    status: "Open",
    icon: Mail,
  },
  {
    name: "Support Request",
    channel: "Contact Form",
    message: "I need help with my order.",
    status: "Pending",
    icon: User,
  },
];

export default async function InboxPage({ params }: Props) {
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
            Unified Inbox
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Inbox for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Manage AI chat messages, customer emails, contact forms, support
            tickets, sales conversations, and follow-ups from one inbox.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Send size={18} />
              New Message
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <Sparkles size={18} />
              AI Summarize Inbox
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Inbox className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Total Messages</p>
            <h2 className="mt-2 text-3xl font-bold">{conversations.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Bot className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">AI Chats</p>
            <h2 className="mt-2 text-3xl font-bold">1</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Mail className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Emails</p>
            <h2 className="mt-2 text-3xl font-bold">1</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Open Leads</p>
            <h2 className="mt-2 text-3xl font-bold">2</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <MessageCircle className="text-yellow-400" />
              <h2 className="text-2xl font-bold">Conversations</h2>
            </div>

            <div className="space-y-4">
              {conversations.map((conversation) => {
                const Icon = conversation.icon;

                return (
                  <button
                    key={conversation.name}
                    className="w-full rounded-3xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-yellow-400/50"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                          <Icon size={22} />
                        </div>

                        <div>
                          <h3 className="font-bold">{conversation.name}</h3>
                          <p className="mt-1 text-sm text-yellow-300">
                            {conversation.channel}
                          </p>
                          <p className="mt-3 text-sm leading-6 text-zinc-400">
                            {conversation.message}
                          </p>
                        </div>
                      </div>

                      <span className="w-fit rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                        {conversation.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <h2 className="text-2xl font-bold">AI Inbox Assistant</h2>

            <p className="mt-5 text-sm leading-7 text-zinc-300">
              CreatorOS AI will summarize conversations, detect hot leads,
              draft replies, assign follow-ups, answer support questions, and
              help close more customers automatically.
            </p>

            <button className="mt-6 w-full rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300">
              Generate Reply
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}