"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Eye,
  FileText,
  Globe,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";

type Business = {
  id: string;
  name: string;
  slug: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

type WebsitePage = {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  html_content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  is_homepage: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
};

type Props = {
  business: Business;
  initialPages: WebsitePage[];
};

const starterPages = [
  "Home",
  "About",
  "Services",
  "Products",
  "Pricing",
  "FAQ",
  "Contact",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function buildStarterHtml(title: string, business: Business) {
  if (title.toLowerCase() === "home") {
    return `
      <section>
        <p>AI-Powered Website</p>
        <h1>${business.storefront_headline || business.name}</h1>
        <p>${business.storefront_subheadline || business.description || "A premium business website powered by CreatorOS AI."}</p>
      </section>
    `.trim();
  }

  return `
    <section>
      <p>${business.name}</p>
      <h1>${title}</h1>
      <p>${business.description || "This page was generated with CreatorOS AI."}</p>
    </section>
  `.trim();
}

export default function WebsiteBuilderClient({
  business,
  initialPages,
}: Props) {
  const [pages, setPages] = useState<WebsitePage[]>(initialPages);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [status, setStatus] = useState("draft");
  const [isHomepage, setIsHomepage] = useState(false);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const filteredPages = useMemo(() => {
    const search = query.toLowerCase();

    return pages.filter((page) => {
      return (
        page.title.toLowerCase().includes(search) ||
        page.slug.toLowerCase().includes(search) ||
        (page.seo_title ?? "").toLowerCase().includes(search) ||
        (page.seo_description ?? "").toLowerCase().includes(search)
      );
    });
  }, [pages, query]);

  const publishedCount = useMemo(
    () => pages.filter((page) => page.status === "published").length,
    [pages]
  );

  function resetForm() {
    setTitle("");
    setSlug("");
    setSeoTitle("");
    setSeoDescription("");
    setHtmlContent("");
    setStatus("draft");
    setIsHomepage(false);
  }

  function fillStarterPage(pageTitle: string) {
    setTitle(pageTitle);
    setSlug(slugify(pageTitle));
    setSeoTitle(`${pageTitle} | ${business.name}`);
    setSeoDescription(
      business.description || `${pageTitle} page for ${business.name}.`
    );
    setHtmlContent(buildStarterHtml(pageTitle, business));
    setIsHomepage(pageTitle.toLowerCase() === "home");
  }

  async function createPage() {
    const pageTitle = title.trim();

    if (!pageTitle || saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const res = await fetch("/api/website-pages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: business.id,
          title: pageTitle,
          slug: slug || slugify(pageTitle),
          html_content:
            htmlContent || buildStarterHtml(pageTitle, business),
          seo_title: seoTitle || `${pageTitle} | ${business.name}`,
          seo_description: seoDescription || business.description,
          status,
          is_homepage: isHomepage,
          content: {
            generatedBy: "CreatorOS AI",
            sections: [],
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to create website page.");
      }

      const createdPage = data.page as WebsitePage;

      setPages((current) =>
        createdPage.is_homepage
          ? [createdPage, ...current.map((page) => ({ ...page, is_homepage: false }))]
          : [createdPage, ...current]
      );

      resetForm();
      setSuccess("Website page created.");
    } catch (createError) {
      console.error(createError);
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to create website page."
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishPage(page: WebsitePage) {
    try {
      setBusyId(page.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/website-pages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: page.id,
          status: page.status === "published" ? "draft" : "published",
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update page.");
      }

      setPages((current) =>
        current.map((item) =>
          item.id === page.id ? (data.page as WebsitePage) : item
        )
      );

      setSuccess(
        page.status === "published" ? "Page moved to draft." : "Page published."
      );
    } catch (publishError) {
      console.error(publishError);
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Unable to update page."
      );
    } finally {
      setBusyId("");
    }
  }

  async function setHomepage(page: WebsitePage) {
    try {
      setBusyId(page.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/website-pages", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: page.id,
          is_homepage: true,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to set homepage.");
      }

      const updatedPage = data.page as WebsitePage;

      setPages((current) =>
        current.map((item) =>
          item.id === updatedPage.id
            ? updatedPage
            : { ...item, is_homepage: false }
        )
      );

      setSuccess("Homepage updated.");
    } catch (homepageError) {
      console.error(homepageError);
      setError(
        homepageError instanceof Error
          ? homepageError.message
          : "Unable to set homepage."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deletePage(page: WebsitePage) {
    try {
      setBusyId(page.id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/website-pages?id=${page.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to delete page.");
      }

      setPages((current) => current.filter((item) => item.id !== page.id));
      setSuccess("Website page deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete page."
      );
    } finally {
      setBusyId("");
    }
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Pages</p>
          <p className="mt-2 text-3xl font-black">{pages.length}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Published</p>
          <p className="mt-2 text-3xl font-black">{publishedCount}</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs text-zinc-500">Website URL</p>
          <p className="mt-2 truncate text-sm font-black text-yellow-200">
            {business.slug ? `/site/${business.slug}` : "No slug"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-xl font-black">Create Website Page</h2>
                <p className="text-sm text-zinc-500">
                  Build a page for this AI website.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <input
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  if (!slug) setSlug(slugify(event.target.value));
                }}
                placeholder="Page title"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <input
                value={slug}
                onChange={(event) => setSlug(slugify(event.target.value))}
                placeholder="page-slug"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <input
                value={seoTitle}
                onChange={(event) => setSeoTitle(event.target.value)}
                placeholder="SEO title"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <textarea
                value={seoDescription}
                onChange={(event) => setSeoDescription(event.target.value)}
                placeholder="SEO description"
                rows={3}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <textarea
                value={htmlContent}
                onChange={(event) => setHtmlContent(event.target.value)}
                placeholder="HTML content"
                rows={7}
                className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs leading-6 text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>

                <button
                  type="button"
                  onClick={() => setIsHomepage((current) => !current)}
                  className={
                    isHomepage
                      ? "rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-200"
                      : "rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-zinc-400"
                  }
                >
                  {isHomepage ? "Homepage" : "Not Homepage"}
                </button>
              </div>

              <button
                type="button"
                onClick={createPage}
                disabled={saving || !title.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Create Page
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
            <h3 className="font-black text-yellow-100">
              Quick Page Generator
            </h3>

            <div className="mt-4 grid gap-2">
              {starterPages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => fillStarterPage(page)}
                  className="rounded-2xl border border-yellow-400/20 bg-black/30 px-4 py-3 text-left text-sm font-bold text-yellow-100/80 transition hover:bg-yellow-400/10"
                >
                  Generate {page}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-black">Website Pages</h2>
              <p className="text-sm text-zinc-500">
                Create, publish, and manage your AI website pages.
              </p>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search pages..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:w-72"
              />
            </div>
          </div>

          {filteredPages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-zinc-600" />
              <h3 className="mt-4 font-black">No pages found</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Create your first website page or use the quick page generator.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPages.map((page) => {
                const busy = busyId === page.id;

                return (
                  <div
                    key={page.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black">{page.title}</h3>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                            {page.status}
                          </span>

                          {page.is_homepage ? (
                            <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                              Homepage
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 font-mono text-xs text-zinc-500">
                          /site/{business.slug}/{page.slug}
                        </p>

                        <p className="mt-3 text-sm leading-6 text-zinc-400">
                          {page.seo_description ||
                            page.seo_title ||
                            "No SEO description saved."}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {business.slug ? (
                          <a
                            href={
                              page.is_homepage
                                ? `/site/${business.slug}`
                                : `/site/${business.slug}/${page.slug}`
                            }
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => publishPage(page)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs font-bold text-emerald-300 disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                          {page.status === "published" ? "Draft" : "Publish"}
                        </button>

                        {!page.is_homepage ? (
                          <button
                            type="button"
                            onClick={() => setHomepage(page)}
                            disabled={busy}
                            className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs font-bold text-yellow-200 disabled:opacity-60"
                          >
                            Homepage
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => deletePage(page)}
                          disabled={busy}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-xs font-bold text-red-300 disabled:opacity-60"
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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
  );
}