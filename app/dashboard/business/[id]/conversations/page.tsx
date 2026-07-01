import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Inbox,
  Mail,
  MessageCircle,
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

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
};

type ConversationRow = {
  id: string;
  business_id: string;
  customer_name: string | null;
  customer_email: string | null;
  channel: string | null;
  status: string | null;
  subject?: string | null;
  last_message: string | null;
  unread_count: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function normalizeConversation(row: Record<string, unknown>): ConversationRow {
  return {
    id: String(row.id),
    business_id: String(row.business_id),
    customer_name:
      typeof row.customer_name === "string" ? row.customer_name : null,
    customer_email:
      typeof row.customer_email === "string" ? row.customer_email : null,
    channel: typeof row.channel === "string" ? row.channel : "storefront",
    status: typeof row.status === "string" ? row.status : "open",
    subject: typeof row.subject === "string" ? row.subject : null,
    last_message:
      typeof row.last_message === "string" ? row.last_message : null,
    unread_count:
      typeof row.unread_count === "number" ? row.unread_count : 0,
    metadata:
      typeof row.metadata === "object" && row.metadata !== null
        ? (row.metadata as Record<string, unknown>)
        : null,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
    updated_at:
      typeof row.updated_at === "string"
        ? row.updated_at
        : typeof row.created_at === "string"
          ? row.created_at
          : new Date().toISOString(),
  };
}

async function loadConversations(id: string) {
  const [businessResult, conversationsResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("business_id", id)
      .order("updated_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (conversationsResult.error) {
    throw conversationsResult.error;
  }

  return {
    business: businessResult.data as BusinessRow,
    conversations: (
      (conversationsResult.data ?? []) as Record<string, unknown>[]
    ).map(normalizeConversation),
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusStyles(status: string | null) {
  if (status === "closed" || status === "resolved") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function getChannelIcon(channel: string | null) {
  if (channel === "email") return Mail;
  if (channel === "ai-chat" || channel === "storefront") return Bot;
  return MessageCircle;
}

export default async function ConversationsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadConversations(id);

  if (!data) {
    notFound();
  }

  const { business, conversations } = data;

  const openConversations = conversations.filter(
    (conversation) => (conversation.status ?? "open") === "open"
  );

  const resolvedConversations = conversations.filter(
    (conversation) =>
      conversation.status === "closed" || conversation.status === "resolved"
  );

  const unreadTotal = conversations.reduce(
    (sum, conversation) => sum + Number(conversation.unread_count ?? 0),
    0
  );

  const uniqueCustomers = new Set(
    conversations
      .map((conversation) => conversation.customer_email)
      .filter(Boolean)
  );

  const statCards = [
    {
      label: "Total Conversations",
      value: conversations.length.toString(),
      icon: Inbox,
    },
    {
      label: "Open",
      value: openConversations.length.toString(),
      icon: MessageCircle,
    },
    {
      label: "Unread",
      value: unreadTotal.toString(),
      icon: Clock,
    },
    {
      label: "Customers",
      value: uniqueCustomers.size.toString(),
      icon: Users,
    },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Inbox className="h-3.5 w-3.5" />
                  Conversation Inbox
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Messages for {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Manage customer messages, AI chat conversations, support
                  requests, sales questions, and follow-ups from one unified
                  inbox.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {business.slug ? (
                  <Link
                    href={`/storefront/${business.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                  >
                    Preview Storefront
                    <Sparkles className="h-4 w-4" />
                  </Link>
                ) : null}

                <Link
                  href={`/dashboard/business/${business.id}/automation`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  Automations
                  <Bot className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                  <Icon className="h-5 w-5" />
                </div>

                <p className="text-xs text-zinc-500">{card.label}</p>
                <h2 className="mt-2 text-3xl font-black">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <CheckCircle2 className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Resolved</p>
            <h2 className="mt-2 text-3xl font-black">
              {resolvedConversations.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">AI Inbox Engine</p>
            <h2 className="mt-2 text-3xl font-black">Ready</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Sparkles className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Inbox Status</p>
            <h2 className="mt-2 text-3xl font-black">Live</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-black">Conversation Database</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Conversations are created when customers chat, email, submit
                forms, or contact your AI employee.
              </p>
            </div>

            <div className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-200">
              Step 7 adds search, reply, close, and inbox controls
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-white/10 bg-black/40 p-10 text-center">
              <MessageCircle className="mx-auto h-14 w-14 text-yellow-200" />

              <h3 className="mt-5 text-2xl font-black">
                No conversations yet
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Customer conversations will appear here once someone messages
                your business or talks to your AI employee.
              </p>

              {business.slug ? (
                <Link
                  href={`/storefront/${business.slug}`}
                  className="mt-6 inline-flex rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Preview Storefront
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="hidden grid-cols-6 border-b border-white/10 bg-black/60 px-5 py-4 text-sm font-bold text-zinc-400 lg:grid">
                <span>Customer</span>
                <span>Channel</span>
                <span>Status</span>
                <span>Last Message</span>
                <span>Updated</span>
                <span className="text-right">Actions</span>
              </div>

              <div className="divide-y divide-white/10">
                {conversations.map((conversation) => {
                  const ChannelIcon = getChannelIcon(conversation.channel);

                  return (
                    <div
                      key={conversation.id}
                      className="grid gap-4 bg-black/30 p-5 lg:grid-cols-6 lg:items-center"
                    >
                      <div>
                        <p className="font-bold">
                          {conversation.customer_name || "Website Visitor"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {conversation.customer_email || "No email"}
                        </p>
                      </div>

                      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-300">
                        <ChannelIcon className="h-3.5 w-3.5" />
                        {conversation.channel || "storefront"}
                      </span>

                      <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${getStatusStyles(
                          conversation.status
                        )}`}
                      >
                        {conversation.status || "open"}
                      </span>

                      <p className="line-clamp-2 text-sm leading-6 text-zinc-400">
                        {conversation.last_message || "No message preview."}
                      </p>

                      <p className="text-sm text-zinc-500">
                        {formatDate(conversation.updated_at)}
                      </p>

                      <div className="flex justify-start gap-2 lg:justify-end">
                        {conversation.customer_email ? (
                          <a
                            href={`mailto:${conversation.customer_email}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-200"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                        ) : null}

                        <Link
                          href={`/dashboard/business/${business.id}/crm`}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-200"
                        >
                          CRM
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}