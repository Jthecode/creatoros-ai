import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CreditCard,
  Rocket,
  Sparkles,
} from "lucide-react";

const features = [
  "AI business builder",
  "AI-generated storefronts",
  "Products and services",
  "Creator dashboard",
  "AI sales employees",
  "Payments and subscriptions",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-400">
            The AI Operating System for Creators
          </p>

          <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
            Launch your creator business in minutes.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            CreatorOS AI helps creators build storefronts, sell products,
            manage customers, automate marketing, and deploy AI employees from
            one powerful platform.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/ai-builder"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300"
            >
              Build With AI
              <ArrowRight size={20} />
            </Link>

            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-4 font-bold text-white transition hover:border-yellow-400/50"
            >
              View Dashboard
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="text-yellow-400" size={20} />
                <span className="text-zinc-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl">
          <div className="rounded-[1.5rem] border border-yellow-400/20 bg-black p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-500">CreatorOS AI</p>
                <h2 className="text-2xl font-bold">Business Launch</h2>
              </div>

              <div className="rounded-2xl bg-yellow-400 p-3 text-black">
                <Sparkles size={24} />
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: BriefcaseBusiness,
                  title: "Business Profile",
                  text: "Generated brand, offer, audience, and positioning.",
                },
                {
                  icon: Rocket,
                  title: "Storefront",
                  text: "Homepage, products, pricing, FAQ, and checkout.",
                },
                {
                  icon: Bot,
                  title: "AI Employee",
                  text: "Sales assistant trained on your business.",
                },
                {
                  icon: CreditCard,
                  title: "Payments",
                  text: "Ready for products, subscriptions, and orders.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="rounded-xl bg-yellow-400/10 p-2 text-yellow-400">
                        <Icon size={20} />
                      </div>
                      <h3 className="font-bold">{item.title}</h3>
                    </div>

                    <p className="text-sm leading-6 text-zinc-400">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}