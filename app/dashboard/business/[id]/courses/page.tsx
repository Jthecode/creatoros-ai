import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  Layers,
  Lock,
  PlayCircle,
  Plus,
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
  description: string | null;
  audience: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name, description, audience")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as BusinessRow;
}

const courseTemplates = [
  {
    title: "Starter Course",
    description: "A simple beginner course for new customers.",
    lessons: 5,
    icon: BookOpen,
  },
  {
    title: "Premium Masterclass",
    description: "A higher-ticket training experience with deeper lessons.",
    lessons: 12,
    icon: GraduationCap,
  },
  {
    title: "Membership Curriculum",
    description: "A recurring course library for monthly subscribers.",
    lessons: 20,
    icon: Lock,
  },
];

export default async function CoursesPage({ params }: Props) {
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
            AI Course Builder
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Courses for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Create online courses, lessons, modules, paid trainings,
            masterclasses, and membership content with AI.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Sparkles size={18} />
              Generate Course
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <Plus size={18} />
              New Course
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <GraduationCap className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Courses</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Layers className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Lessons</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Users className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Students</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <PlayCircle className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Course Engine</p>
            <h2 className="mt-2 text-3xl font-bold">Ready</h2>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Sparkles className="text-yellow-400" />
            <h2 className="text-2xl font-bold">AI Course Templates</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {courseTemplates.map((template) => {
              const Icon = template.icon;

              return (
                <div
                  key={template.title}
                  className="rounded-3xl border border-white/10 bg-black/40 p-6"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                    <Icon size={22} />
                  </div>

                  <h3 className="text-xl font-bold">{template.title}</h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    {template.description}
                  </p>

                  <p className="mt-5 text-sm font-bold text-yellow-400">
                    {template.lessons} lesson starter structure
                  </p>

                  <button className="mt-6 w-full rounded-2xl border border-yellow-400/40 px-5 py-3 font-bold text-yellow-400 transition hover:bg-yellow-400/10">
                    Use Template
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}