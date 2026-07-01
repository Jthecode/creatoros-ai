"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  Inbox,
  Loader2,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
  User,
  XCircle,
} from "lucide-react";

type ConversationStatus = "open" | "pending" | "resolved" | "closed";

type Conversation = {
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

type Props = {
  businessId: string;
  initialConversations: Conversation[];
};

const statuses: ConversationStatus[] = ["open", "pending", "resolved", "closed"];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getStatusClass(status: string | null) {
  if (status === "resolved" || status === "closed") {
    return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (status === "pending") {
    return "border-yellow-400/20 bg-yellow-400/10 text-yellow-200";
  }

  return "border-white/10 bg-white/[0.04] text-zinc-300";
}

function getStatusIcon(status: string | null) {
  if (status === "resolved" || status === "closed") return CheckCircle2;
  if (status === "pending") return Clock;
  return MessageCircle;
}

function getChannelIcon(channel: string | null) {
  if (channel === "email") return Mail;
  if (channel === "ai-chat" || channel === "storefront") return Bot;
  return MessageCircle;
}

function getMessagesFromMetadata(conversation: Conversation) {
  const messages = conversation.metadata?.messages;

  if (!Array.isArray(messages)) return [];

  return messages
    .map((message, index) => {
      if (!message || typeof message !== "object") return null;

      const row = message as {
        role?: unknown;
        content?: unknown;
        createdAt?: unknown;
      };

      return {
        id: `${conversation.id}-${index}`,
        role:
          row.role === "assistant" || row.role === "user"
            ? row.role
            : "assistant",
        content: typeof row.content === "string" ? row.content : "",
        createdAt:
          typeof row.createdAt === "string"
            ? row.createdAt
            : conversation.updated_at,
      };
    })
    .filter((message): message is {
      id: string;
      role: "assistant" | "user";
      content: string;
      createdAt: string;
    } => Boolean(message && message.content));
}

export default function ConversationsClient({
  businessId,
  initialConversations,
}: Props) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reply, setReply] = useState("");
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedConversation = useMemo(() => {
    return (
      conversations.find((conversation) => conversation.id === selectedId) ??
      conversations[0] ??
      null
    );
  }, [conversations, selectedId]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      const search = query.toLowerCase();

      const matchesSearch =
        (conversation.customer_name ?? "").toLowerCase().includes(search) ||
        (conversation.customer_email ?? "").toLowerCase().includes(search) ||
        (conversation.subject ?? "").toLowerCase().includes(search) ||
        (conversation.last_message ?? "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ? true : conversation.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [conversations, query, statusFilter]);

  const selectedMessages = selectedConversation
    ? getMessagesFromMetadata(selectedConversation)
    : [];

  async function refreshConversations() {
    try {
      setBusyId("refresh");
      setError("");
      setSuccess("");

      const res = await fetch(`/api/conversations?businessId=${businessId}`, {
        cache: "no-store",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to refresh conversations.");
      }

      const nextConversations = Array.isArray(data.conversations)
        ? data.conversations
        : [];

      setConversations(nextConversations);

      if (!nextConversations.find((item: Conversation) => item.id === selectedId)) {
        setSelectedId(nextConversations[0]?.id ?? "");
      }

      setSuccess("Conversations refreshed.");
    } catch (refreshError) {
      console.error(refreshError);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Unable to refresh conversations."
      );
    } finally {
      setBusyId("");
    }
  }

  async function updateConversation(
    conversation: Conversation,
    updates: Partial<{
      status: ConversationStatus;
      unread_count: number;
      last_message: string;
      metadata: Record<string, unknown>;
    }>
  ) {
    try {
      setBusyId(conversation.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/conversations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: conversation.id,
          businessId,
          ...updates,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update conversation.");
      }

      setConversations((current) =>
        current.map((item) =>
          item.id === conversation.id
            ? (data.conversation as Conversation)
            : item
        )
      );

      setSuccess("Conversation updated.");
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update conversation."
      );
    } finally {
      setBusyId("");
    }
  }

  async function sendReply() {
    if (!selectedConversation || !reply.trim()) return;

    const existingMessages = getMessagesFromMetadata(selectedConversation);

    const nextMessages = [
      ...existingMessages,
      {
        id: `${selectedConversation.id}-reply-${Date.now()}`,
        role: "assistant" as const,
        content: reply.trim(),
        createdAt: new Date().toISOString(),
      },
    ];

    await updateConversation(selectedConversation, {
      last_message: reply.trim(),
      unread_count: 0,
      status: "open",
      metadata: {
        ...(selectedConversation.metadata ?? {}),
        messages: nextMessages,
        repliedFrom: "business_inbox",
        repliedAt: new Date().toISOString(),
      },
    });

    setReply("");
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-black">Inbox Controls</h2>
            <p className="text-sm text-zinc-500">
              Search conversations, open threads, reply, and close requests.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshConversations}
            disabled={busyId === "refresh"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busyId === "refresh" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <Inbox className="h-5 w-5 text-yellow-200" />
            <h2 className="text-xl font-black">Conversation List</h2>
          </div>

          {filteredConversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-zinc-600" />
              <h3 className="mt-4 font-black">No conversations found</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => {
                const ChannelIcon = getChannelIcon(conversation.channel);
                const StatusIcon = getStatusIcon(conversation.status);
                const active = selectedConversation?.id === conversation.id;

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => setSelectedId(conversation.id)}
                    className={
                      active
                        ? "w-full rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-left"
                        : "w-full rounded-2xl border border-white/10 bg-black/30 p-4 text-left transition hover:border-yellow-400/30"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black">
                          {conversation.customer_name || "Website Visitor"}
                        </p>

                        <p className="mt-1 text-xs text-zinc-500">
                          {conversation.customer_email || "No email"}
                        </p>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-bold capitalize ${getStatusClass(
                          conversation.status
                        )}`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {conversation.status || "open"}
                      </span>
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-400">
                      {conversation.last_message || "No message preview."}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1 capitalize">
                        <ChannelIcon className="h-3.5 w-3.5" />
                        {conversation.channel || "storefront"}
                      </span>

                      <span>{formatDate(conversation.updated_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          {!selectedConversation ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
              <MessageCircle className="mx-auto h-10 w-10 text-zinc-600" />
              <h3 className="mt-4 font-black">Select a conversation</h3>
            </div>
          ) : (
            <div>
              <div className="mb-5 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                      <User className="h-5 w-5" />
                    </div>

                    <div>
                      <h2 className="text-xl font-black">
                        {selectedConversation.customer_name ||
                          "Website Visitor"}
                      </h2>

                      <p className="text-sm text-zinc-500">
                        {selectedConversation.customer_email || "No email"}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-zinc-500">
                    {selectedConversation.subject ||
                      `Conversation #${selectedConversation.id.slice(0, 8)}`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedConversation.customer_email ? (
                    <a
                      href={`mailto:${selectedConversation.customer_email}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  ) : null}

                  <select
                    value={
                      (selectedConversation.status as ConversationStatus) ||
                      "open"
                    }
                    onChange={(event) =>
                      updateConversation(selectedConversation, {
                        status: event.target.value as ConversationStatus,
                      })
                    }
                    disabled={busyId === selectedConversation.id}
                    className="rounded-xl border border-white/10 bg-black px-4 py-2 text-sm font-bold text-zinc-300 outline-none disabled:opacity-60"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="max-h-[420px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4">
                {selectedMessages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-sm text-zinc-500">
                    No saved message history. Last message:{" "}
                    {selectedConversation.last_message || "None"}
                  </div>
                ) : (
                  selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={
                        message.role === "user"
                          ? "flex justify-start"
                          : "flex justify-end"
                      }
                    >
                      <div
                        className={
                          message.role === "user"
                            ? "max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-zinc-200"
                            : "max-w-[85%] rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold leading-6 text-black"
                        }
                      >
                        <div className="mb-1 text-[11px] font-black uppercase tracking-wide opacity-70">
                          {message.role === "user" ? "Customer" : "Business"}
                        </div>

                        {message.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4">
                <textarea
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  placeholder="Write a reply..."
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
                />

                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={
                      !reply.trim() || busyId === selectedConversation.id
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busyId === selectedConversation.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send Reply
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateConversation(selectedConversation, {
                        status: "resolved",
                        unread_count: 0,
                      })
                    }
                    disabled={busyId === selectedConversation.id}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-3 text-sm font-bold text-emerald-300 disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}