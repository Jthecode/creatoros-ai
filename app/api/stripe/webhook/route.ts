import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable.");
}

if (!stripeWebhookSecret) {
  throw new Error("Missing STRIPE_WEBHOOK_SECRET environment variable.");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-06-24.dahlia",
});

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getMetadataValue(
  metadata: Stripe.Metadata | null | undefined,
  key: string
) {
  if (!metadata) return "";
  return cleanString(metadata[key]);
}

async function trackAnalytics(params: {
  businessId: string;
  event: string;
  productId?: string | null;
  orderId?: string | null;
  revenue?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "stripe_webhook",
      product_id: params.productId || null,
      order_id: params.orderId || null,
      revenue: params.revenue ?? 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const businessId = getMetadataValue(session.metadata, "businessId");
  const productId = getMetadataValue(session.metadata, "productId");
  const productName =
    getMetadataValue(session.metadata, "productName") || "CreatorOS Product";

  const quantityRaw = getMetadataValue(session.metadata, "quantity");
  const quantity = Number.isFinite(Number(quantityRaw))
    ? Math.max(1, Number(quantityRaw))
    : 1;

  const customerEmail =
    cleanString(session.customer_details?.email) ||
    cleanString(session.customer_email);

  const amountTotal = Number(session.amount_total ?? 0);
  const total = amountTotal / 100;
  const currency = cleanString(session.currency).toUpperCase() || "USD";

  if (!businessId) {
    console.error("Missing businessId in checkout session metadata.");
    return;
  }

  const { data: existingOrder, error: existingOrderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("business_id", businessId)
    .filter("metadata->>stripe_checkout_session_id", "eq", session.id)
    .maybeSingle();

  if (existingOrderError) {
    throw existingOrderError;
  }

  if (existingOrder) {
    const previousMetadata =
      typeof existingOrder.metadata === "object" && existingOrder.metadata !== null
        ? existingOrder.metadata
        : {};

    const { data: updatedOrder, error: updateError } = await supabaseAdmin
      .from("orders")
      .update({
        customer_email: customerEmail || existingOrder.customer_email || null,
        payment_status: "paid",
        fulfillment_status: existingOrder.fulfillment_status || "unfulfilled",
        total,
        currency,
        metadata: {
          ...previousMetadata,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          stripe_customer_id:
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id ?? null,
          stripe_payment_status: session.payment_status,
          paidAt: new Date().toISOString(),
        },
      })
      .eq("id", existingOrder.id)
      .select()
      .single();

    if (updateError) throw updateError;

    await trackAnalytics({
      businessId,
      event: "checkout_completed",
      productId: productId || existingOrder.product_id || null,
      orderId: updatedOrder.id,
      revenue: total,
      metadata: {
        stripeCheckoutSessionId: session.id,
        productName,
        customerEmail,
        updatedExistingOrder: true,
      },
    });

    return;
  }

  const unitPrice = quantity > 0 ? total / quantity : total;

  const { data: newOrder, error: insertError } = await supabaseAdmin
    .from("orders")
    .insert({
      business_id: businessId,
      product_id: productId || null,
      product_name: productName,
      quantity,
      unit_price: unitPrice,
      subtotal: total,
      tax: 0,
      shipping: 0,
      total,
      currency,
      customer_email: customerEmail || null,
      payment_status: "paid",
      fulfillment_status: "unfulfilled",
      notes: "Created from Stripe checkout completed webhook.",
      metadata: {
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
        stripe_customer_id:
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id ?? null,
        stripe_payment_status: session.payment_status,
        paidAt: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (insertError) throw insertError;

  await trackAnalytics({
    businessId,
    event: "checkout_completed",
    productId: productId || null,
    orderId: newOrder.id,
    revenue: total,
    metadata: {
      stripeCheckoutSessionId: session.id,
      productName,
      customerEmail,
      createdNewOrder: true,
    },
  });

  await trackAnalytics({
    businessId,
    event: "product_purchase",
    productId: productId || null,
    orderId: newOrder.id,
    revenue: total,
    metadata: {
      stripeCheckoutSessionId: session.id,
      productName,
      quantity,
      currency,
    },
  });
}

async function handleCheckoutExpired(session: Stripe.Checkout.Session) {
  const businessId = getMetadataValue(session.metadata, "businessId");

  if (!businessId) return;

  await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "failed",
      metadata: {
        stripe_checkout_session_id: session.id,
        stripe_payment_status: "expired",
        expiredAt: new Date().toISOString(),
      },
    })
    .eq("business_id", businessId)
    .filter("metadata->>stripe_checkout_session_id", "eq", session.id);

  await trackAnalytics({
    businessId,
    event: "checkout_expired",
    metadata: {
      stripeCheckoutSessionId: session.id,
    },
  });
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const businessId = getMetadataValue(paymentIntent.metadata, "businessId");
  const productId = getMetadataValue(paymentIntent.metadata, "productId");

  if (!businessId) return;

  await trackAnalytics({
    businessId,
    event: "payment_failed",
    productId: productId || null,
    revenue: Number(paymentIntent.amount ?? 0) / 100,
    metadata: {
      stripePaymentIntentId: paymentIntent.id,
      failureMessage: paymentIntent.last_payment_error?.message ?? null,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Stripe signature.",
        },
        {
          status: 400,
        }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        stripeWebhookSecret as string
      );
    } catch (error) {
      console.error("Stripe webhook signature verification failed:", error);

      return NextResponse.json(
        {
          success: false,
          error: "Invalid Stripe webhook signature.",
        },
        {
          status: 400,
        }
      );
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutExpired(session);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentFailed(paymentIntent);
        break;
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
        break;
    }

    return NextResponse.json({
      success: true,
      received: true,
      type: event.type,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Stripe webhook failed.",
      },
      {
        status: 500,
      }
    );
  }
}