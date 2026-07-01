"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
} from "lucide-react";

import ProductCheckoutButton from "@/components/ProductCheckoutButton";

type Product = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  price_cents?: number;
  currency: string;
  type: string;
  status: string;
  image_url?: string | null;
  category?: string | null;
  featured?: boolean | null;
  inventory?: number | null;
};

type Props = {
  businessId: string;
  businessName?: string;
};

function formatPrice(product: Product) {
  const price =
    typeof product.price === "number"
      ? product.price
      : Number(product.price_cents ?? 0) / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(price);
}

function getPriceCents(product: Product) {
  if (typeof product.price_cents === "number") {
    return product.price_cents;
  }

  return Math.round(Number(product.price ?? 0) * 100);
}

export default function StorefrontProductGrid({
  businessId,
  businessName = "this business",
}: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/products?businessId=${businessId}&status=active`,
          {
            cache: "no-store",
          }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.error || "Unable to load products.");
        }

        if (!cancelled) {
          setProducts(Array.isArray(data?.products) ? data.products : []);
        }
      } catch (loadError) {
        console.error(loadError);

        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load products."
          );
          setProducts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (businessId) {
      void loadProducts();
    }

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const categories = useMemo(() => {
    const unique = new Set<string>();

    products.forEach((product) => {
      if (product.category) {
        unique.add(product.category);
      }

      if (product.type) {
        unique.add(product.type);
      }
    });

    return ["all", ...Array.from(unique)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = query.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        (product.description ?? "").toLowerCase().includes(search) ||
        (product.category ?? "").toLowerCase().includes(search) ||
        product.type.toLowerCase().includes(search);

      const matchesCategory =
        category === "all"
          ? true
          : product.category === category || product.type === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, query, category]);

  async function trackProductView(product: Product) {
    try {
      await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          event: "product_view",
          productId: product.id,
          metadata: {
            productName: product.name,
            productType: product.type,
            category: product.category,
            source: "StorefrontProductGrid",
          },
        }),
      });
    } catch {
      // Analytics should never block storefront browsing.
    }
  }

  function openProduct(product: Product) {
    setSelectedProduct(product);
    void trackProductView(product);
  }

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-zinc-400">
        <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-yellow-200" />
        Loading products...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
          {error}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
              <ShoppingBag className="h-3.5 w-3.5" />
              Storefront Products
            </div>

            <h2 className="mt-4 text-3xl font-black text-white">
              Shop {businessName}
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Browse products, services, subscriptions, and digital offers.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 sm:w-72"
              />
            </div>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All Products" : item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-10 text-center">
          <Package className="mx-auto h-10 w-10 text-zinc-600" />
          <h3 className="mt-4 text-xl font-black">No products found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
            Add active products in the business dashboard and they will appear
            here automatically.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => {
            const priceCents = getPriceCents(product);
            const isOutOfStock =
              typeof product.inventory === "number" && product.inventory <= 0;

            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/20"
              >
                <button
                  type="button"
                  onClick={() => openProduct(product)}
                  className="group block aspect-[4/3] w-full bg-black/40"
                >
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-14 w-14 text-zinc-700" />
                    </div>
                  )}
                </button>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-white">
                        {product.name}
                      </h3>

                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-zinc-500">
                        {product.category || product.type}
                      </p>
                    </div>

                    {product.featured ? (
                      <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                    ) : null}
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
                    {product.description || "No description provided yet."}
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-2xl font-black text-yellow-300">
                      {formatPrice(product)}
                    </p>

                    <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                      {product.type}
                    </span>
                  </div>

                  {isOutOfStock ? (
                    <button
                      disabled
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-zinc-500"
                    >
                      Out of Stock
                    </button>
                  ) : (
                    <ProductCheckoutButton
                      businessId={businessId}
                      productId={product.id}
                      productName={product.name}
                      priceCents={priceCents}
                      currency={product.currency}
                      buttonLabel="Buy Now"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => openProduct(product)}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                  >
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedProduct ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 backdrop-blur-sm sm:items-center">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-white/10 bg-[#080808] shadow-2xl shadow-black">
            <div className="aspect-[16/9] bg-black/50">
              {selectedProduct.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedProduct.image_url}
                  alt={selectedProduct.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Package className="h-16 w-16 text-zinc-700" />
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                <Sparkles className="h-3.5 w-3.5" />
                Product Details
              </div>

              <h3 className="mt-4 text-3xl font-black">
                {selectedProduct.name}
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {selectedProduct.description || "No description provided yet."}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-300">
                  {selectedProduct.type}
                </span>

                {selectedProduct.category ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold text-zinc-300">
                    {selectedProduct.category}
                  </span>
                ) : null}

                {selectedProduct.featured ? (
                  <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                    Featured
                  </span>
                ) : null}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/40 p-5">
                <p className="text-sm text-zinc-500">Price</p>
                <p className="mt-1 text-4xl font-black text-yellow-300">
                  {formatPrice(selectedProduct)}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <ProductCheckoutButton
                  businessId={businessId}
                  productId={selectedProduct.id}
                  productName={selectedProduct.name}
                  priceCents={getPriceCents(selectedProduct)}
                  currency={selectedProduct.currency}
                  buttonLabel="Checkout Now"
                />

                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}