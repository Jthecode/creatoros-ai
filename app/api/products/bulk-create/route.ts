import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type GeneratedProductInput = {
  name?: string;
  description?: string;
  price?: string | number;
  type?: string;
};

function parsePriceToCents(price: string | number | undefined) {
  if (typeof price === "number") {
    return Math.round(price * 100);
  }

  if (!price) return 0;

  const cleaned = price.replace(/[^0-9.]/g, "");
  const amount = Number(cleaned);

  if (Number.isNaN(amount)) return 0;

  return Math.round(amount * 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const businessId = body.businessId as string | undefined;
    const products = body.products as GeneratedProductInput[] | undefined;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!products || products.length === 0) {
      return NextResponse.json(
        { error: "At least one product is required." },
        { status: 400 }
      );
    }

    const rows = products
      .filter((product) => product.name?.trim())
      .map((product) => ({
        business_id: businessId,
        name: product.name?.trim(),
        description: product.description?.trim() || null,
        price_cents: parsePriceToCents(product.price),
        currency: "USD",
        type: product.type || "service",
        status: "draft",
      }));

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "No valid products found." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert(rows)
      .select();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      products: data,
    });
  } catch (error) {
    console.error("Bulk create products error:", error);

    return NextResponse.json(
      { error: "Unable to create products." },
      { status: 500 }
    );
  }
}