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
import FilesClient from "./client";

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

type BusinessFile = {
  id: string;
  business_id: string;
  name: string | null;
  file_name: string | null;
  file_url: string | null;
  file_type: string | null;
  folder: string | null;
  size_bytes: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function loadFilesPage(id: string) {
  const [businessResult, filesResult] = await Promise.all([
    supabaseAdmin.from("businesses").select("id, name").eq("id", id).single(),

    supabaseAdmin
      .from("business_files")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) return null;
  if (filesResult.error) throw filesResult.error;

  return {
    business: businessResult.data as Business,
    files: (filesResult.data ?? []) as BusinessFile[],
  };
}

function isImage(file: BusinessFile) {
  const type = file.file_type ?? "";
  const url = file.file_url ?? "";

  return (
    type.startsWith("image/") || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(url)
  );
}

function isVideo(file: BusinessFile) {
  const type = file.file_type ?? "";
  const url = file.file_url ?? "";

  return type.startsWith("video/") || /\.(mp4|mov|webm|avi)$/i.test(url);
}

function isDocument(file: BusinessFile) {
  const type = file.file_type ?? "";
  const url = file.file_url ?? "";

  return type.includes("pdf") || /\.(pdf|doc|docx|txt|csv)$/i.test(url);
}

export default async function FilesPage({ params }: Props) {
  const { id } = await params;
  const data = await loadFilesPage(id);

  if (!data) notFound();

  const { business, files } = data;

  const images = files.filter(isImage);
  const videos = files.filter(isVideo);
  const documents = files.filter(isDocument);

  const folders = new Set(
    files
      .map((file) => file.folder)
      .filter((folder): folder is string => Boolean(folder))
  );

  const fileTypes = [
    {
      title: "Images",
      description: "Logos, graphics, banners, thumbnails and brand assets.",
      icon: ImageIcon,
      count: images.length,
    },
    {
      title: "Videos",
      description: "Promos, ads, clips, reels, trainings and course videos.",
      icon: Video,
      count: videos.length,
    },
    {
      title: "Documents",
      description: "PDFs, contracts, guides, scripts and business documents.",
      icon: FileText,
      count: documents.length,
    },
    {
      title: "Brand Assets",
      description: "Media kits, color palettes, logos and identity files.",
      icon: FileImage,
      count: files.filter((file) => file.folder === "brand-assets").length,
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
                  <FolderOpen className="h-3.5 w-3.5" />
                  Business Files
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Files for {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Manage brand assets, documents, images, videos, AI-generated
                  files, contracts, media kits, product files, and business
                  resources.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#file-manager"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Upload className="h-4 w-4" />
                  Upload File
                </a>

                <a
                  href="#file-manager"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Plus className="h-4 w-4" />
                  New Folder
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <File className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Files</p>
            <h2 className="mt-2 text-3xl font-black">{files.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <FolderOpen className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Folders</p>
            <h2 className="mt-2 text-3xl font-black">{folders.size}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <ImageIcon className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Media Assets</p>
            <h2 className="mt-2 text-3xl font-black">
              {images.length + videos.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <FileText className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Documents</p>
            <h2 className="mt-2 text-3xl font-black">{documents.length}</h2>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {fileTypes.map((type) => {
            const Icon = type.icon;

            return (
              <div
                key={type.title}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                  <Icon className="h-5 w-5" />
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black">{type.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-zinc-400">
                      {type.description}
                    </p>
                  </div>

                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                    {type.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div id="file-manager">
          <FilesClient businessId={business.id} initialFiles={files} />
        </div>
      </section>
    </main>
  );
}