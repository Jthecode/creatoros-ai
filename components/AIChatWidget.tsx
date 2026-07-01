"use client";

import { useRef, useState } from "react";
import {
  Bot,
  Loader2,
  Send,
  User,
  X,
  MessageCircle,
} from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type AIChatWidgetProps = {
  businessId: string;
  businessName: string;
};

export default function AIChatWidget({
  businessId,
  businessName,
}: AIChatWidgetProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hi 👋 Welcome to ${businessName}. I'm your AI sales assistant. Ask me anything about our products, pricing, or services.`,
    },
  ]);

  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    const value = inputRef.current?.value.trim();

    if (!value) return;

    const userMessage: Message = {
      role: "user",
      content: value,
    };

    setMessages((prev) => [...prev, userMessage]);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          message: value,
        }),
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.reply ??
            "I'm still learning about this business. Please check back soon.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I couldn't process your request right now.",
        },
      ]);
    }

    setLoading(false);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-full bg-yellow-400 px-6 py-4 font-bold text-black shadow-2xl transition hover:scale-105"
        >
          <MessageCircle size={22} />
          AI Employee
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[650px] w-[390px] flex-col overflow-hidden rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 bg-black px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                <Bot size={22} />
              </div>

              <div>
                <h2 className="font-bold">
                  {businessName} AI
                </h2>

                <p className="text-xs text-green-400">
                  Online
                </p>
              </div>
            </div>

            <button onClick={() => setOpen(false)}>
              <X />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "assistant"
                    ? "justify-start"
                    : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-3xl px-5 py-4 ${
                    message.role === "assistant"
                      ? "bg-zinc-900"
                      : "bg-yellow-400 text-black"
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold">
                    {message.role === "assistant" ? (
                      <>
                        <Bot size={14} />
                        AI
                      </>
                    ) : (
                      <>
                        <User size={14} />
                        You
                      </>
                    )}
                  </div>

                  <p className="text-sm leading-7">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-4">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                placeholder="Ask about products..."
                className="flex-1 rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    sendMessage();
                  }
                }}
              />

              <button
                onClick={sendMessage}
                disabled={loading}
                className="rounded-2xl bg-yellow-400 p-4 text-black"
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Send />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}