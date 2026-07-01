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
  Search,
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

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
};

type MessageRow = {
  id: string;
  sender: string | null;
  content: string | null;
  ai_generated: boolean | null;
  created_at: string;
};

type ConversationRow = {
  id: string;
  business_id: string;
  customer_name: string | null;
  customer_email: string | null;
  channel: string | null;
  status: string | null;
  last_message: string | null;
  unread_count: number | null;
  created_at: string;
  updated_at: string;
  messages?: MessageRow[];
};

async function loadConversations(id: string) {
  const [businessResult, conversationsResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("conversations")
      .select(
        `
        id,
        business_id,
        customer_name,
        customer_email,
        channel,
        status,
        last_message,
        unread_count,
        created_at,
        updated_at,
        messages (
          id,
          sender,
          content,
          ai_generated,
          created_at
        )
      `
      )
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
    conversations: (conversationsResult.data ?? []) as ConversationRow[],
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
    return "border-green-500/20 bg-green-500/10 text-green-300";
  }

  if (status === "pending") {
    return "border-yellow-500/20 bg-yellow-500/10 text-yellow-300";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function getChannelIcon(channel: string | null) {
  if (channel === "email") return Mail;
  if (channel === "ai-chat") return Bot;
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

  const aiMessages = conversations.reduce((sum, conversation) => {
    const messages = conversation.messages ?? [];
    return sum + messages.filter((message) => message.ai_generated).length;
  }, 0);

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
      label: "AI Replies",
      value: aiMessages.toString(),
      icon: Bot,
    },
  ];

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
            Conversation Inbox
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Messages for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Manage customer messages, AI chat conversations, support requests,
            sales questions, and follow-ups from one unified inbox.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/dashboard/business/${business.id}/inbox`}
              className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
            >
              <Inbox size={18} />
              Open Inbox
            </Link>

            <Link
              href={`/dashboard/business/${business.id}/employees`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50"
            >
              <Bot size={18} />
              AI Employees
            </Link>

            <Link
              href={`/dashboard/business/${business.id}/automation`}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50"
            >
              <Sparkles size={18} />
              Automations
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                  <Icon size={22} />
                </div>

                <p className="text-sm text-zinc-400">{card.label}</p>
                <h2 className="mt-2 text-3xl font-bold">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <CheckCircle2 className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Resolved</p>
            <h2 className="mt-2 text-3xl font-bold">
              {resolvedConversations.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Customers</p>
            <h2 className="mt-2 text-3xl font-bold">
              {
                new Set(
                  conversations
                    .map((conversation) => conversation.customer_email)
                    .filter(Boolean)
                ).size
              }
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Sparkles className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">AI Inbox Engine</p>
            <h2 className="mt-2 text-3xl font-bold">Ready</h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Conversation Database</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Conversations are created when customers chat, email, submit
                forms, or contact your AI employee.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-zinc-500">
              <Search size={18} />
              <span className="text-sm">Search coming soon...</span>
            </div>
          </div>

          {conversations.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-black/40 p-10 text-center">
              <MessageCircle size={56} className="mx-auto text-yellow-400" />

              <h3 className="mt-5 text-2xl font-bold">
                No conversations yet
              </h3>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
                Customer conversations will appear here once someone messages
                your business or talks to your AI employee.
              </p>

              <Link
                href={`/storefront/${business.slug}`}
                className="mt-6 inline-flex rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
              >
                Preview Storefront
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-white/10">
              <div className="hidden grid-cols-6 border-b border-white/10 bg-black/60 px-5 py-4 text-sm font-semibold text-zinc-400 lg:grid">
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
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                            <User size={18} />
                          </div>

                          <div>
                            <p className="font-bold">
                              {conversation.customer_name || "Website Visitor"}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {conversation.customer_email || "No email"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs capitalize text-zinc-300">
                          <ChannelIcon size={14} />
                          {conversation.channel || "website"}
                        </span>
                      </div>

                      <div>
                        <span
                          className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusStyles(
                            conversation.status
                          )}`}
                        >
                          {conversation.status || "open"}
                        </span>
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-zinc-400">
                        {conversation.last_message || "No message preview."}
                      </p>

                      <p className="text-sm text-zinc-500">
                        {formatDate(conversation.updated_at)}
                      </p>

                      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                        {conversation.customer_email && (
                          <a
                            href={`mailto:${conversation.customer_email}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
                          >
                            <Mail size={15} />
                            Email
                          </a>
                        )}

                        <Link
                          href={`/dashboard/business/${business.id}/crm`}
                          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
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