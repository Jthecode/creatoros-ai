import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name} in environment variables.`);
  }

  return value;
}

const stripe = new Stripe(getRequiredEnv("STRIPE_SECRET_KEY"));
const stripeWebhookSecret = getRequiredEnv("STRIPE_WEBHOOK_SECRET");

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature." },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      stripeWebhookSecret
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const businessId = session.metadata?.businessId;
      const productId = session.metadata?.productId;

      if (!businessId) {
        return NextResponse.json(
          { error: "Missing businessId in Stripe metadata." },
          { status: 400 }
        );
      }

      const customerEmail =
        session.customer_details?.email ||
        session.customer_email ||
        "unknown@customer.com";

      const totalCents = session.amount_total ?? 0;
      const currency = session.currency?.toUpperCase() || "USD";

      const { error } = await supabaseAdmin.from("orders").insert({
        business_id: businessId,
        customer_email: customerEmail,
        total_cents: totalCents,
        currency,
        status: "paid",
      });

      if (error) {
        throw error;
      }

      if (productId) {
        console.log("Paid product:", productId);
      }
    }

    return NextResponse.json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook error:", error);

    return NextResponse.json({ error: "Webhook failed." }, { status: 400 });
  }
}