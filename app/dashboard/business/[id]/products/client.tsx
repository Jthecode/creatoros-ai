"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

type ProductStatus = "draft" | "active" | "archived";
type ProductType = "digital" | "physical" | "service" | "subscription";

type Product = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  price_cents?: number | null;
  currency: string | null;
  type: string | null;
  status: string | null;
  image_url?: string | null;
  file_url?: string | null;
  inventory?: number | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

type Props = {
  businessId: string;
  initialProducts: Product[];
};

type FormState = {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  type: ProductType;
  status: ProductStatus;
  image_url: string;
  file_url: string;
  inventory: string;
};

const emptyForm: FormState = {
  id: "",
  name: "",
  description: "",
  price: "",
  currency: "USD",
  type: "service",
  status: "draft",
  image_url: "",
  file_url: "",
  inventory: "",
};

function getPrice(product: Product) {
  if (typeof product.price === "number") return product.price;
  if (typeof product.price_cents === "number") return product.price_cents / 100;
  return 0;
}

function formatCurrency(product: Product) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: product.currency || "USD",
  }).format(getPrice(product));
}

export default function ProductsClient({ businessId, initialProducts }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const editing = Boolean(form.id);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const search = query.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(search) ||
        (product.description ?? "").toLowerCase().includes(search) ||
        (product.type ?? "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" ? true : product.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [products, query, statusFilter]);

  function resetForm() {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  }

  function editProduct(product: Product) {
    setForm({
      id: product.id,
      name: product.name ?? "",
      description: product.description ?? "",
      price: String(getPrice(product)),
      currency: product.currency ?? "USD",
      type: (product.type as ProductType) || "service",
      status: (product.status as ProductStatus) || "draft",
      image_url: product.image_url ?? "",
      file_url: product.file_url ?? "",
      inventory:
        typeof product.inventory === "number" ? String(product.inventory) : "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        id: form.id || undefined,
        businessId,
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price || 0),
        currency: form.currency || "USD",
        type: form.type,
        status: form.status,
        image_url: form.image_url.trim() || null,
        file_url: form.file_url.trim() || null,
        inventory: form.inventory ? Number(form.inventory) : null,
      };

      const res = await fetch("/api/products", {
        method: editing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to save product.");
      }

      const savedProduct = data.product as Product;

      setProducts((current) =>
        editing
          ? current.map((product) =>
              product.id === savedProduct.id ? savedProduct : product
            )
          : [savedProduct, ...current]
      );

      setSuccess(editing ? "Product updated." : "Product created.");
      setForm(emptyForm);
    } catch (saveError) {
      console.error(saveError);
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(product: Product, status: ProductStatus) {
    try {
      setBusyId(product.id);
      setError("");
      setSuccess("");

      const res = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: product.id,
          status,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to update product.");
      }

      setProducts((current) =>
        current.map((item) =>
          item.id === product.id ? (data.product as Product) : item
        )
      );

      setSuccess(`Product ${status}.`);
    } catch (updateError) {
      console.error(updateError);
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Unable to update product."
      );
    } finally {
      setBusyId("");
    }
  }

  async function deleteProduct(product: Product) {
    try {
      setBusyId(product.id);
      setError("");
      setSuccess("");

      const res = await fetch(`/api/products?id=${product.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to delete product.");
      }

      setProducts((current) =>
        current.filter((item) => item.id !== product.id)
      );

      setSuccess("Product deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete product."
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

      <form
        onSubmit={saveProduct}
        className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6"
      >
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
            <Plus className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-black">
              {editing ? "Edit Product" : "Create Product"}
            </h2>
            <p className="text-sm text-zinc-500">
              Add or update storefront checkout products.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Product name"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.price}
            onChange={(event) =>
              setForm((current) => ({ ...current, price: event.target.value }))
            }
            placeholder="Price"
            type="number"
            min="0"
            step="0.01"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <select
            value={form.type}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                type: event.target.value as ProductType,
              }))
            }
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
            <option value="service">Service</option>
            <option value="subscription">Subscription</option>
          </select>

          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                status: event.target.value as ProductStatus,
              }))
            }
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>

          <input
            value={form.image_url}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                image_url: event.target.value,
              }))
            }
            placeholder="Image URL"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.file_url}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                file_url: event.target.value,
              }))
            }
            placeholder="File URL"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.inventory}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                inventory: event.target.value,
              }))
            }
            placeholder="Inventory"
            type="number"
            min="0"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <input
            value={form.currency}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                currency: event.target.value.toUpperCase(),
              }))
            }
            placeholder="Currency"
            className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
          />

          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Product description"
            rows={4}
            className="resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40 md:col-span-2"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {saving ? "Saving..." : editing ? "Update Product" : "Create Product"}
          </button>

          {editing ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-bold text-zinc-300"
            >
              Cancel Edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black">Manage Products</h2>
            <p className="text-sm text-zinc-500">
              Edit, publish, archive, or delete products.
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
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-yellow-400/40"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-zinc-600" />
            <h3 className="mt-4 font-black">No products found</h3>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProducts.map((product) => {
              const isBusy = busyId === product.id;

              return (
                <div
                  key={product.id}
                  className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <h3 className="text-xl font-black">{product.name}</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                      {product.description || "No description saved."}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                        {product.type || "service"}
                      </span>

                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold capitalize text-zinc-400">
                        {product.status || "draft"}
                      </span>

                      <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold text-yellow-200">
                        {formatCurrency(product)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => editProduct(product)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </button>

                    {product.status !== "active" ? (
                      <button
                        type="button"
                        onClick={() => updateStatus(product, "active")}
                        disabled={isBusy}
                        className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-300 disabled:opacity-60"
                      >
                        Publish
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateStatus(product, "archived")}
                        disabled={isBusy}
                        className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-bold text-zinc-300 disabled:opacity-60"
                      >
                        Archive
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteProduct(product)}
                      disabled={isBusy}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300 disabled:opacity-60"
                    >
                      {isBusy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}