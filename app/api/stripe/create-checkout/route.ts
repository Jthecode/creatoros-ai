import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia",
});

type CheckoutBody = {
  businessId?: string;
  business_id?: string;
  productId?: string;
  product_id?: string;
  productName?: string;
  product_name?: string;
  priceCents?: number;
  price_cents?: number;
  currency?: string;
  quantity?: number;
  customerEmail?: string;
  customer_email?: string;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: CheckoutBody) {
  return cleanString(body.businessId || body.business_id);
}

function getProductId(body: CheckoutBody) {
  return cleanString(body.productId || body.product_id);
}

function getProductName(body: CheckoutBody) {
  return cleanString(body.productName || body.product_name);
}

function getCustomerEmail(body: CheckoutBody) {
  return cleanString(body.customerEmail || body.customer_email);
}

function normalizeCurrency(value: unknown) {
  const currency = cleanString(value).toLowerCase();
  return currency || "usd";
}

function normalizeQuantity(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.floor(value));
  }

  return 1;
}

function normalizePriceCents(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(50, Math.round(value));
  }

  return 0;
}

function getBaseUrl(request: NextRequest) {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_URL;

  if (envUrl) {
    return envUrl.startsWith("http") ? envUrl : `https://${envUrl}`;
  }

  return request.nextUrl.origin;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CheckoutBody;

    const businessId = getBusinessId(body);
    const productId = getProductId(body);
    const productNameFromBody = getProductName(body);
    const customerEmail = getCustomerEmail(body);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!productId && !productNameFromBody) {
      return NextResponse.json(
        { success: false, error: "productId or productName is required." },
        { status: 400 }
      );
    }

    let productName = productNameFromBody || "CreatorOS Product";
    let priceCents = normalizePriceCents(body.priceCents ?? body.price_cents);
    let currency = normalizeCurrency(body.currency);

    if (productId) {
      const { data: product, error: productError } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", productId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (productError) throw productError;

      if (product) {
        productName = cleanString(product.name) || productName;
        priceCents = normalizePriceCents(product.price_cents ?? priceCents);
        currency = normalizeCurrency(product.currency ?? currency);
      }
    }

    if (!productName) {
      return NextResponse.json(
        { success: false, error: "Product name is required." },
        { status: 400 }
      );
    }

    if (!priceCents || priceCents < 50) {
      return NextResponse.json(
        { success: false, error: "Valid priceCents is required." },
        { status: 400 }
      );
    }

    const quantity = normalizeQuantity(body.quantity);
    const baseUrl = getBaseUrl(request);

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: customerEmail || undefined,
      line_items: [
        {
          quantity,
          price_data: {
            currency,
            unit_amount: priceCents,
            product_data: {
              name: productName,
              metadata: {
                businessId,
                productId,
              },
            },
          },
        },
      ],
      metadata: {
        businessId,
        productId,
        productName,
        quantity: String(quantity),
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancelled`,
    });

    await supabaseAdmin.from("orders").insert({
      business_id: businessId,
      product_id: productId || null,
      product_name: productName,
      quantity,
      unit_price: priceCents / 100,
      subtotal: (priceCents * quantity) / 100,
      tax: 0,
      shipping: 0,
      total: (priceCents * quantity) / 100,
      currency: currency.toUpperCase(),
      customer_email: customerEmail || null,
      payment_status: "pending",
      fulfillment_status: "unfulfilled",
      notes: "Created from Stripe checkout session.",
      metadata: {
        stripe_checkout_session_id: checkoutSession.id,
        checkout_url: checkoutSession.url,
      },
    });

    await supabaseAdmin.from("analytics_events").insert({
      business_id: businessId,
      event: "checkout_started",
      product_id: productId || null,
      revenue: (priceCents * quantity) / 100,
      metadata: {
        productName,
        quantity,
        currency,
        stripeCheckoutSessionId: checkoutSession.id,
      },
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to create checkout session.",
      },
      { status: 500 }
    );
  }
}