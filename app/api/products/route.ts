import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ProductType = "digital" | "physical" | "service" | "subscription";
type ProductStatus = "draft" | "active" | "archived";

type ProductBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  name?: string;
  description?: string | null;
  price?: number | string;
  price_cents?: number;
  currency?: string;
  type?: ProductType;
  status?: ProductStatus;
  image_url?: string | null;
  file_url?: string | null;
  inventory?: number | null;
  metadata?: Record<string, unknown> | null;
};

function getBusinessId(body: ProductBody) {
  return body.businessId || body.business_id || "";
}

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeCurrency(value: unknown) {
  const currency = normalizeString(value).toUpperCase();
  return currency || "USD";
}

function normalizeProductType(value: unknown): ProductType {
  const type = normalizeString(value).toLowerCase();

  if (
    type === "digital" ||
    type === "physical" ||
    type === "service" ||
    type === "subscription"
  ) {
    return type;
  }

  return "digital";
}

function normalizeProductStatus(value: unknown): ProductStatus {
  const status = normalizeString(value).toLowerCase();

  if (status === "draft" || status === "active" || status === "archived") {
    return status;
  }

  return "draft";
}

function priceToCents(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value * 100));
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parsed = Number.parseFloat(cleaned);

    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed * 100));
    }
  }

  return 0;
}

function centsToPrice(cents: unknown) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return 0;
  return cents / 100;
}

function cleanProduct(product: Record<string, unknown>) {
  return {
    ...product,
    price: centsToPrice(product.price_cents),
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const productId = searchParams.get("id");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId is required.",
        },
        {
          status: 400,
        }
      );
    }

    let query = supabaseAdmin
      .from("products")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (productId) {
      query = query.eq("id", productId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (type) {
      query = query.eq("type", type);
    }

    if (q) {
      query = query.ilike("name", `%${q}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    const products = Array.isArray(data)
      ? data.map((product) => cleanProduct(product))
      : [];

    return NextResponse.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load products."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProductBody;

    const businessId = getBusinessId(body);
    const name = normalizeString(body.name);
    const description = normalizeString(body.description);
    const currency = normalizeCurrency(body.currency);
    const type = normalizeProductType(body.type);
    const status = normalizeProductStatus(body.status);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Product name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const priceCents =
      typeof body.price_cents === "number" && Number.isFinite(body.price_cents)
        ? Math.max(0, Math.round(body.price_cents))
        : priceToCents(body.price);

    const inventory =
      typeof body.inventory === "number" && Number.isFinite(body.inventory)
        ? Math.max(0, Math.floor(body.inventory))
        : null;

    const { data, error } = await supabaseAdmin
      .from("products")
      .insert({
        business_id: businessId,
        name,
        description: description || null,
        price_cents: priceCents,
        currency,
        type,
        status,
        image_url: body.image_url ?? null,
        file_url: body.file_url ?? null,
        inventory,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        product: cleanProduct(data),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create product."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as ProductBody;

    const id = normalizeString(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.name !== undefined) {
      const name = normalizeString(body.name);

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: "Product name cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      updates.name = name;
    }

    if (body.description !== undefined) {
      const description = normalizeString(body.description);
      updates.description = description || null;
    }

    if (body.price !== undefined || body.price_cents !== undefined) {
      updates.price_cents =
        typeof body.price_cents === "number" && Number.isFinite(body.price_cents)
          ? Math.max(0, Math.round(body.price_cents))
          : priceToCents(body.price);
    }

    if (body.currency !== undefined) {
      updates.currency = normalizeCurrency(body.currency);
    }

    if (body.type !== undefined) {
      updates.type = normalizeProductType(body.type);
    }

    if (body.status !== undefined) {
      updates.status = normalizeProductStatus(body.status);
    }

    if (body.image_url !== undefined) {
      updates.image_url = body.image_url;
    }

    if (body.file_url !== undefined) {
      updates.file_url = body.file_url;
    }

    if (body.inventory !== undefined) {
      updates.inventory =
        typeof body.inventory === "number" && Number.isFinite(body.inventory)
          ? Math.max(0, Math.floor(body.inventory))
          : null;
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No product updates provided.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      product: cleanProduct(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update product."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete product."),
      },
      {
        status: 500,
      }
    );
  }
}