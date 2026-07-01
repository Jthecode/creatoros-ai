import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bot,
  CheckCircle2,
  Globe,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Users,
  Zap,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import StorefrontAIChat from "@/components/StorefrontAIChat";
import StorefrontLeadForm from "@/components/StorefrontLeadForm";
import StorefrontProductGrid from "@/components/StorefrontProductGrid";

export const dynamic = "force-dynamic";

type StorefrontPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  generated_data:
    | {
        checklist?: string[];
        faq?: {
          question: string;
          answer: string;
        }[];
      }
    | null;
};

type AIAgentRow = {
  id: string;
  name: string | null;
  role: string | null;
  opening_message: string | null;
  instructions: string | null;
};

async function getStorefront(slug: string) {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select(
      "id, name, slug, tagline, description, industry, audience, storefront_headline, storefront_subheadline, generated_data"
    )
    .eq("slug", slug)
    .single();

  if (businessError || !business) {
    return null;
  }

  const { data: agents, error: agentsError } = await supabaseAdmin
    .from("ai_agents")
    .select("id, name, role, opening_message, instructions")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1);

  if (agentsError) throw agentsError;

  await supabaseAdmin.from("analytics_events").insert({
    business_id: business.id,
    event: "storefront_view",
    page: `/storefront/${slug}`,
    source: "storefront",
    revenue: 0,
    metadata: {
      slug,
      businessName: business.name,
    },
  });

  return {
    business: business as BusinessRow,
    aiAgent: ((agents ?? [])[0] ?? null) as AIAgentRow | null,
  };
}

export default async function StorefrontPage({
  params,
}: StorefrontPageProps) {
  const { slug } = await params;
  const storefront = await getStorefront(slug);

  if (!storefront) {
    notFound();
  }

  const { business, aiAgent } = storefront;

  const checklist =
    business.generated_data?.checklist &&
    business.generated_data.checklist.length > 0
      ? business.generated_data.checklist
      : [
          "AI-generated business positioning",
          "Premium storefront and product layout",
          "Built-in lead capture system",
          "Stripe checkout-ready products",
          "AI sales employee support area",
        ];

  const faqs =
    business.generated_data?.faq && business.generated_data.faq.length > 0
      ? business.generated_data.faq
      : [
          {
            question: "What is this storefront powered by?",
            answer:
              "This storefront is powered by CreatorOS AI, an AI business operating system for launching and growing online businesses.",
          },
          {
            question: "Can I contact the business before buying?",
            answer:
              "Yes. Use the request form or AI assistant to ask questions before taking the next step.",
          },
          {
            question: "Is checkout connected?",
            answer:
              "Products can connect directly to Stripe checkout once the business owner activates live payments.",
          },
        ];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
          >
            <Sparkles className="h-4 w-4 text-yellow-200" />
            CreatorOS AI
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            {business.industry ? (
              <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-zinc-300">
                {business.industry}
              </span>
            ) : null}

            <a
              href="#products"
              className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200"
            >
              Shop Products
            </a>

            <a
              href="#contact"
              className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold text-zinc-300 transition hover:text-white"
            >
              Contact
            </a>
          </div>
        </header>

        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-6 sm:p-10 lg:p-14">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-yellow-200">
                  <Store className="h-4 w-4" />
                  AI Generated Storefront
                </div>

                <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
                  {business.storefront_headline || business.name}
                </h1>

                <p className="mt-5 text-lg font-bold text-yellow-200 sm:text-xl">
                  {business.tagline || "Powered by CreatorOS AI"}
                </p>

                <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg">
                  {business.storefront_subheadline ||
                    business.description ||
                    "A premium creator storefront powered by CreatorOS AI."}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#products"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 text-sm font-black text-black transition hover:bg-yellow-300"
                  >
                    Shop Now
                    <ShoppingBag className="h-5 w-5" />
                  </a>

                  <a
                    href="#ai-employee"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-6 py-4 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                  >
                    Ask AI Employee
                    <MessageCircle className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
                    <Bot className="h-6 w-6" />
                  </div>

                  <div>
                    <p className="text-sm font-bold text-yellow-100/70">
                      AI Sales Employee
                    </p>
                    <h2 className="text-2xl font-black text-yellow-100">
                      {aiAgent?.name || "CreatorOS AI"}
                    </h2>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold text-yellow-200">
                  {aiAgent?.role || "AI Sales Manager"}
                </p>

                <p className="mt-4 text-sm leading-7 text-yellow-100/75">
                  {aiAgent?.opening_message ||
                    "Hi! I can help answer questions, recommend products, and guide you toward the best next step."}
                </p>

                <a
                  href="#ai-chat"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Start Chat
                  <Zap className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Globe className="h-7 w-7 text-yellow-200" />
            <h3 className="mt-4 text-lg font-black">Online Storefront</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Built to showcase offers, products, and services.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <h3 className="mt-4 text-lg font-black">AI Assistant</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Answers questions and supports customers.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <ShieldCheck className="h-7 w-7 text-yellow-200" />
            <h3 className="mt-4 text-lg font-black">Secure Checkout</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Product buttons connect to Stripe checkout.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Users className="h-7 w-7 text-yellow-200" />
            <h3 className="mt-4 text-lg font-black">Lead Capture</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Visitors can request info before buying.
            </p>
          </div>
        </section>

        <section id="products">
          <StorefrontProductGrid
            businessId={business.id}
            businessName={business.name}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">What You Get</h2>
                <p className="text-sm text-zinc-500">
                  Benefits generated for this storefront.
                </p>
              </div>
            </div>

            <ul className="space-y-3 text-sm leading-6 text-zinc-300">
              {checklist.map((item, index) => (
                <li
                  key={`${item}-${index}`}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-yellow-200" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div id="contact">
            <StorefrontLeadForm
              businessId={business.id}
              businessName={business.name}
              source="storefront"
            />
          </div>
        </section>

        <section id="ai-employee" className="grid gap-6 lg:grid-cols-2">
          <div
            id="ai-chat"
            className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
                <Bot className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black text-yellow-100">
                  {aiAgent?.name || "AI Sales Employee"}
                </h2>
                <p className="text-sm font-semibold text-yellow-200">
                  {aiAgent?.role || "AI Sales Manager"}
                </p>
              </div>
            </div>

            <p className="text-sm leading-7 text-yellow-100/75">
              {aiAgent?.opening_message ||
                "Every storefront includes an AI employee trained to answer questions, explain offers, capture leads, and support customers."}
            </p>
          </div>

          <StorefrontAIChat
            businessId={business.id}
            businessName={business.name}
            agentName={aiAgent?.name || "CreatorOS AI"}
            openingMessage={
              aiAgent?.opening_message ||
              "Hi! I’m the AI assistant for this storefront. Ask me anything about this business."
            }
            source="storefront"
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
              <MessageCircle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black">FAQ</h2>
              <p className="text-sm text-zinc-500">
                Common questions about this storefront.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-white/10 bg-black/30 p-5"
              >
                <h3 className="font-black">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <footer className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center text-sm text-zinc-500">
          <p>
            {business.name} is powered by{" "}
            <Link href="/" className="font-bold text-yellow-200">
              CreatorOS AI
            </Link>
            .
          </p>
        </footer>
      </section>
    </main>
  );
}