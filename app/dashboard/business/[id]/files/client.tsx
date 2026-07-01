"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Download,
  File,
  FileArchive,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

type FileCategory =
  | "all"
  | "branding"
  | "marketing"
  | "sales"
  | "legal"
  | "finance"
  | "products"
  | "images"
  | "videos"
  | "documents"
  | "ai-generated";

type BusinessFile = {
  id: string;
  business_id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  category: Exclude<FileCategory, "all">;
  favorite: boolean;
  created_at: string;
};

type Props = {
  businessId: string;
};

const categories: {
  value: FileCategory;
  label: string;
}[] = [
  { value: "all", label: "All Files" },
  { value: "branding", label: "Branding" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "legal", label: "Legal" },
  { value: "finance", label: "Finance" },
  { value: "products", label: "Products" },
  { value: "images", label: "Images" },
  { value: "videos", label: "Videos" },
  { value: "documents", label: "Documents" },
  { value: "ai-generated", label: "AI Generated" },
];

const starterFiles: BusinessFile[] = [];

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";

  const sizes = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(index === 0 ? 0 : 1)} ${sizes[index]}`;
}

function getFileCategory(file: File): BusinessFile["category"] {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith("image/")) return "images";
  if (type.startsWith("video/")) return "videos";
  if (type.startsWith("audio/")) return "marketing";
  if (name.includes("logo") || name.includes("brand")) return "branding";
  if (name.includes("contract") || name.includes("agreement")) return "legal";
  if (name.includes("invoice") || name.includes("finance")) return "finance";
  if (name.includes("product")) return "products";
  if (name.includes("campaign") || name.includes("ad")) return "marketing";

  return "documents";
}

function getFileIcon(file: BusinessFile) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith("image/")) return FileImage;
  if (type.startsWith("video/")) return FileVideo;
  if (type.startsWith("audio/")) return FileAudio;
  if (name.endsWith(".zip")) return FileArchive;
  if (
    name.endsWith(".pdf") ||
    name.endsWith(".doc") ||
    name.endsWith(".docx") ||
    name.endsWith(".txt")
  ) {
    return FileText;
  }

  return File;
}

export default function BusinessFilesClient({ businessId }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<BusinessFile[]>(starterFiles);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FileCategory>("all");
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const filteredFiles = useMemo(() => {
    return files.filter((file) => {
      const matchesQuery =
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        file.category.toLowerCase().includes(query.toLowerCase()) ||
        file.type.toLowerCase().includes(query.toLowerCase());

      const matchesCategory =
        category === "all" ? true : file.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [files, query, category]);

  const totalStorage = useMemo(() => {
    return files.reduce((sum, file) => sum + file.size, 0);
  }, [files]);

  const imageCount = useMemo(() => {
    return files.filter((file) => file.type.startsWith("image/")).length;
  }, [files]);

  const videoCount = useMemo(() => {
    return files.filter((file) => file.type.startsWith("video/")).length;
  }, [files]);

  const documentCount = useMemo(() => {
    return files.filter(
      (file) =>
        file.category === "documents" ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".docx")
    ).length;
  }, [files]);

  async function uploadFiles(selectedFiles: FileList | File[]) {
    const uploadList = Array.from(selectedFiles);

    if (uploadList.length === 0 || uploading) return;

    try {
      setUploading(true);

      const localFiles: BusinessFile[] = uploadList.map((file) => ({
        id: crypto.randomUUID(),
        business_id: businessId,
        name: file.name,
        size: file.size,
        type: file.type || "application/octet-stream",
        url: URL.createObjectURL(file),
        category: getFileCategory(file),
        favorite: false,
        created_at: new Date().toISOString(),
      }));

      setFiles((current) => [...localFiles, ...current]);

      /*
        When your /api/files route is ready, replace the local preview logic above
        with real upload logic like this:

        const formData = new FormData();
        formData.append("businessId", businessId);

        uploadList.forEach((file) => {
          formData.append("files", file);
        });

        const res = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Failed to upload files");
        }

        const data = await res.json();
        setFiles(data.files ?? []);
      */
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function toggleFavorite(id: string) {
    setFiles((current) =>
      current.map((file) =>
        file.id === id ? { ...file, favorite: !file.favorite } : file
      )
    );
  }

  function deleteFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files?.length) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/30 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Link
                href={`/dashboard/businesses/${businessId}`}
                className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to business
              </Link>

              <div className="inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                Business File Manager
              </div>

              <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
                Files & Assets
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Upload, organize, preview, and manage every file connected to
                this business.
              </p>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Upload Files
            </button>

            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                if (event.target.files) {
                  void uploadFiles(event.target.files);
                }
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Used Storage</p>
            <p className="mt-2 text-2xl font-black">{formatBytes(totalStorage)}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Total Files</p>
            <p className="mt-2 text-2xl font-black">{files.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Images</p>
            <p className="mt-2 text-2xl font-black">{imageCount}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Videos / Docs</p>
            <p className="mt-2 text-2xl font-black">
              {videoCount}/{documentCount}
            </p>
          </div>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={
            dragActive
              ? "rounded-3xl border border-yellow-400/50 bg-yellow-400/10 p-8 text-center"
              : "rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center"
          }
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
            <Plus className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-xl font-black">Drop files here</h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-500">
            Upload logos, brand kits, contracts, product photos, PDFs, videos,
            marketing assets, and AI-generated files.
          </p>

          <button
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
          >
            Browse Files
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <FolderOpen className="h-5 w-5 text-yellow-200" />
              <h2 className="font-bold">Categories</h2>
            </div>

            <div className="mt-5 space-y-2">
              {categories.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setCategory(item.value)}
                  className={
                    category === item.value
                      ? "flex w-full items-center justify-between rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-left text-sm font-bold text-yellow-200"
                      : "flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left text-sm font-bold text-zinc-400 transition hover:text-white"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4">
              <div className="flex items-center gap-2 text-yellow-200">
                <Bot className="h-4 w-4" />
                <p className="text-sm font-black">AI File Assistant</p>
              </div>

              <p className="mt-2 text-xs leading-5 text-yellow-100/70">
                Coming next: ask AI to find, organize, rename, and attach files
                to storefronts or campaigns.
              </p>
            </div>
          </aside>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black">File Library</h2>
                <p className="text-sm text-zinc-500">
                  {filteredFiles.length} file
                  {filteredFiles.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search files..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
                />
              </div>
            </div>

            <div className="mt-5">
              {filteredFiles.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
                  <ImageIcon className="mx-auto h-10 w-10 text-zinc-600" />
                  <h3 className="mt-4 font-black">No files yet</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                    Upload your first business asset to start building your
                    CreatorOS AI file library.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredFiles.map((file) => {
                    const FileIcon = getFileIcon(file);
                    const isImage = file.type.startsWith("image/");
                    const isVideo = file.type.startsWith("video/");
                    const isAudio = file.type.startsWith("audio/");

                    return (
                      <div
                        key={file.id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-black/40"
                      >
                        <div className="flex h-40 items-center justify-center bg-white/[0.03]">
                          {isImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={file.url}
                              alt={file.name}
                              className="h-full w-full object-cover"
                            />
                          ) : isVideo ? (
                            <video
                              src={file.url}
                              controls
                              className="h-full w-full object-cover"
                            />
                          ) : isAudio ? (
                            <div className="w-full px-4">
                              <FileAudio className="mx-auto mb-4 h-10 w-10 text-yellow-200" />
                              <audio src={file.url} controls className="w-full" />
                            </div>
                          ) : (
                            <FileIcon className="h-12 w-12 text-yellow-200" />
                          )}
                        </div>

                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black">
                                {file.name}
                              </h3>
                              <p className="mt-1 text-xs text-zinc-500">
                                {formatBytes(file.size)} · {file.category}
                              </p>
                            </div>

                            <button
                              onClick={() => toggleFavorite(file.id)}
                              className={
                                file.favorite
                                  ? "text-yellow-300"
                                  : "text-zinc-600 transition hover:text-yellow-300"
                              }
                            >
                              <Star className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            <a
                              href={file.url}
                              download={file.name}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>

                            <button
                              onClick={() => deleteFile(file.id)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/10 bg-red-400/5 px-3 py-2 text-xs font-bold text-red-300 transition hover:border-red-400/30"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-1 h-5 w-5 text-yellow-200" />
            <div>
              <h3 className="font-black text-yellow-100">
                Next Upgrade: Connect Supabase Storage
              </h3>
              <p className="mt-2 text-sm leading-6 text-yellow-100/70">
                This client is ready for uploads. Next we will create the
                matching <span className="font-bold">/api/files</span> route so
                files save permanently to Supabase Storage and load back after
                refresh.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}