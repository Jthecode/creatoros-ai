"use client";

import { useMemo, useRef, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Loader2,
  MessageCircle,
  Send,
  Sparkles,
  User,
} from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

type StorefrontAIChatProps = {
  businessId: string;
  businessName?: string;
  agentName?: string;
  openingMessage?: string;
  source?: string;
};

export default function StorefrontAIChat({
  businessId,
  businessName = "this business",
  agentName = "CreatorOS AI",
  openingMessage = "Hi! I’m the AI assistant. Ask me anything about this business.",
  source = "storefront",
}: StorefrontAIChatProps) {
  const messageBoxRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: openingMessage,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const canSend = useMemo(() => {
    return Boolean(businessId && input.trim() && !sending);
  }, [businessId, input, sending]);

  function scrollToBottom() {
    window.setTimeout(() => {
      messageBoxRef.current?.scrollTo({
        top: messageBoxRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 80);
  }

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSend) return;

    const messageText = input.trim();

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText,
      createdAt: new Date().toISOString(),
    };

    const loadingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thinking...",
      createdAt: new Date().toISOString(),
    };

    const optimisticMessages = [...messages, userMessage, loadingMessage];

    try {
      setSending(true);
      setError("");
      setSaved(false);
      setInput("");
      setMessages(optimisticMessages);
      scrollToBottom();

      const res = await fetch("/api/ai/storefront-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          conversationId,
          message: messageText,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content,
          })),
          source,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Could not generate AI response.");
      }

      const assistantMessage: ChatMessage = {
        id: loadingMessage.id,
        role: "assistant",
        content:
          data.reply ||
          `I can help answer questions about ${businessName}, products, services, pricing, and next steps.`,
        createdAt: new Date().toISOString(),
      };

      setMessages([...messages, userMessage, assistantMessage]);

      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setSaved(true);

      window.setTimeout(() => {
        setSaved(false);
      }, 1600);

      scrollToBottom();
    } catch (sendError) {
      console.error(sendError);

      setMessages((current) =>
        current.map((message) =>
          message.id === loadingMessage.id
            ? {
                ...message,
                content:
                  "Sorry, I could not answer right now. Please try again or submit the request form.",
              }
            : message
        )
      );

      setError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send message."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
              <Sparkles className="h-3.5 w-3.5" />
              Live AI Assistant
            </div>

            <h3 className="mt-3 text-lg font-black text-white">{agentName}</h3>

            <p className="mt-1 text-sm leading-6 text-zinc-400">
              Ask questions about {businessName}.
            </p>
          </div>
        </div>

        {saved ? (
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300 sm:flex">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Saved
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      <div
        ref={messageBoxRef}
        className="max-h-[360px] space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-black/40 p-4"
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-semibold leading-6 text-black"
                  : "max-w-[85%] rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-zinc-200"
              }
            >
              <div className="mb-1 flex items-center gap-2 text-[11px] font-black uppercase tracking-wide opacity-70">
                {message.role === "user" ? (
                  <User className="h-3 w-3" />
                ) : (
                  <MessageCircle className="h-3 w-3" />
                )}
                {message.role === "user" ? "You" : agentName}
              </div>

              {message.content === "Thinking..." ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking...
                </span>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question..."
          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
        />

        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex items-center justify-center rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>
    </div>
  );
}