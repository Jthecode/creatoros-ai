import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  DollarSign,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
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
  slug: string | null;
};

type ProductRow = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  type: string | null;
  status: string | null;
  image_url?: string | null;
  file_url?: string | null;
  inventory?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

function formatCurrency(cents: number | null, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

async function loadProducts(id: string) {
  const [businessResult, productsResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("products")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (productsResult.error) throw productsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    products: (productsResult.data ?? []) as ProductRow[],
  };
}

export default async function ProductsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadProducts(id);

  if (!data) {
    notFound();
  }

  const { business, products } = data;

  const activeProducts = products.filter(
    (product) => product.status === "active"
  );

  const draftProducts = products.filter(
    (product) => product.status !== "active"
  );

  const totalValueCents = products.reduce(
    (sum, product) => sum + Number(product.price_cents ?? 0),
    0
  );

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
                  <ShoppingBag className="h-3.5 w-3.5" />
                  Product Manager
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {business.name} Products
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Manage offers, services, packages, memberships, downloads, and
                  checkout-ready products for this CreatorOS AI business.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-200 transition hover:bg-yellow-400/20">
                  <Sparkles className="h-4 w-4" />
                  AI Generate
                </button>

                <a
                  href="#product-catalog"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Plus className="h-4 w-4" />
                  Manage Products
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Package className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Total Products</p>
            <h2 className="mt-2 text-3xl font-black">{products.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <ShoppingBag className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Active Products</p>
            <h2 className="mt-2 text-3xl font-black">
              {activeProducts.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Sparkles className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Draft Products</p>
            <h2 className="mt-2 text-3xl font-black">
              {draftProducts.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <DollarSign className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Catalog Value</p>
            <h2 className="mt-2 text-3xl font-black">
              {formatCurrency(totalValueCents)}
            </h2>
          </div>
        </div>

        <div
          id="product-catalog"
          className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
        >
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black">Product Catalog</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Current products saved to this business.
              </p>
            </div>

            <div className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-4 py-2 text-xs font-bold text-yellow-200">
              Step 8 adds create, edit, archive, and delete controls
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
              <Package className="mx-auto h-10 w-10 text-zinc-600" />

              <h3 className="mt-4 text-xl font-black">No products yet</h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                Generate products with AI or create your first product manually.
                Product editing controls are added in the next step.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                      <Package className="h-6 w-6" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black">{product.name}</h3>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                        {product.description || "No description saved yet."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                          {product.type || "service"}
                        </span>

                        <span
                          className={
                            product.status === "active"
                              ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold capitalize text-emerald-300"
                              : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400"
                          }
                        >
                          {product.status || "draft"}
                        </span>

                        {typeof product.inventory === "number" ? (
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-400">
                            Inventory: {product.inventory}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:flex-col lg:items-end">
                    <p className="text-2xl font-black text-yellow-300">
                      {formatCurrency(
                        product.price_cents,
                        product.currency ?? "USD"
                      )}
                    </p>

                    <p className="text-xs text-zinc-500">
                      {new Date(product.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}