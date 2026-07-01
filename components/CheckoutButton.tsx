"use client";

import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";

type CheckoutButtonProps = {
  productId: string;
  label?: string;
};

export default function CheckoutButton({
  productId,
  label = "Buy Now",
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to start checkout.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      alert("Checkout could not be started. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          Starting Checkout
        </>
      ) : (
        <>
          <ShoppingCart size={20} />
          {label}
        </>
      )}
    </button>
  );
}