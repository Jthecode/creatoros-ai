import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  File,
  FileImage,
  FileText,
  FolderOpen,
  ImageIcon,
  Plus,
  Upload,
  Video,
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

const fileTypes = [
  {
    title: "Images",
    description: "Logos, graphics, banners, thumbnails and brand assets.",
    icon: ImageIcon,
  },
  {
    title: "Videos",
    description: "Promos, ads, clips, reels, trainings and course videos.",
    icon: Video,
  },
  {
    title: "Documents",
    description: "PDFs, contracts, guides, scripts and business documents.",
    icon: FileText,
  },
  {
    title: "Brand Assets",
    description: "Media kits, color palettes, logos and identity files.",
    icon: FileImage,
  },
];

export default async function FilesPage({ params }: Props) {
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
            Business Files
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Files for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Manage brand assets, documents, images, videos, AI-generated files,
            contracts, media kits, product files, and business resources.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Upload size={18} />
              Upload File
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <Plus size={18} />
              New Folder
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <File className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Files</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <FolderOpen className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Folders</p>
            <h2 className="mt-2 text-3xl font-bold">4</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <ImageIcon className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Media Assets</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <FileText className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Documents</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {fileTypes.map((type) => {
            const Icon = type.icon;

            return (
              <button
                key={type.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left transition hover:border-yellow-400/50"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                  <Icon size={22} />
                </div>

                <h2 className="text-2xl font-bold">{type.title}</h2>

                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {type.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}