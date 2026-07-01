"use client";

import { useState } from "react";
import { Loader2, ShoppingCart, Zap } from "lucide-react";

type ProductCheckoutButtonProps = {
  businessId: string;
  productId: string;
  productName: string;
  priceCents: number;
  currency?: string;
  customerEmail?: string;
  quantity?: number;
  buttonLabel?: string;
  className?: string;
};

export default function ProductCheckoutButton({
  businessId,
  productId,
  productName,
  priceCents,
  currency = "USD",
  customerEmail,
  quantity = 1,
  buttonLabel = "Buy Now",
  className = "",
}: ProductCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (!businessId || !productId) {
      setError("Missing checkout details.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await fetch("/api/analytics/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          event: "checkout_started",
          productId,
          metadata: {
            productName,
            priceCents,
            currency,
            quantity,
          },
        }),
      }).catch(() => null);

      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId,
          productId,
          productName,
          priceCents,
          currency,
          customerEmail,
          quantity,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Unable to start checkout.");
      }

      if (!data?.url) {
        throw new Error("Checkout URL was not returned.");
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      console.error(checkoutError);
      setError(
        checkoutError instanceof Error
          ? checkoutError.message
          : "Unable to start checkout."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading}
        className={
          className ||
          "inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : buttonLabel.toLowerCase().includes("buy") ? (
          <ShoppingCart className="h-4 w-4" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
        {loading ? "Starting Checkout..." : buttonLabel}
      </button>

      {error ? (
        <p className="mt-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}