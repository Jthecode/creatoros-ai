import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "cancelled"
  | "completed"
  | "succeeded"
  | "open"
  | "unpaid";

type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "cancelled";

type OrderBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  quantity?: number | string | null;
  unit_price?: number | string | null;
  subtotal?: number | string | null;
  tax?: number | string | null;
  shipping?: number | string | null;
  total?: number | string | null;
  total_cents?: number | string | null;
  currency?: string | null;
  payment_status?: PaymentStatus | string | null;
  fulfillment_status?: FulfillmentStatus | string | null;
  status?: PaymentStatus | string | null;
  stripe_checkout_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: OrderBody) {
  return cleanString(body.businessId || body.business_id);
}

function normalizeMoney(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ""));

    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

function normalizeInteger(value: unknown, fallback = 1) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }

  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);

    if (Number.isFinite(parsed)) {
      return Math.max(1, parsed);
    }
  }

  return fallback;
}

function normalizePaymentStatus(value: unknown): PaymentStatus {
  const status = cleanString(value).toLowerCase();

  if (
    status === "pending" ||
    status === "paid" ||
    status === "failed" ||
    status === "refunded" ||
    status === "cancelled" ||
    status === "completed" ||
    status === "succeeded" ||
    status === "open" ||
    status === "unpaid"
  ) {
    return status;
  }

  return "pending";
}

function normalizeFulfillmentStatus(value: unknown): FulfillmentStatus {
  const status = cleanString(value).toLowerCase();

  if (
    status === "unfulfilled" ||
    status === "processing" ||
    status === "fulfilled" ||
    status === "shipped" ||
    status === "delivered" ||
    status === "cancelled"
  ) {
    return status;
  }

  return "unfulfilled";
}

function calculateTotals(body: OrderBody) {
  const quantity = normalizeInteger(body.quantity, 1);
  const unitPrice = normalizeMoney(body.unit_price);
  const subtotal = body.subtotal !== undefined ? normalizeMoney(body.subtotal) : quantity * unitPrice;
  const tax = normalizeMoney(body.tax);
  const shipping = normalizeMoney(body.shipping);
  const total =
    body.total !== undefined ? normalizeMoney(body.total) : subtotal + tax + shipping;

  const totalCents =
    body.total_cents !== undefined
      ? Math.round(normalizeMoney(body.total_cents))
      : Math.round(total * 100);

  return {
    quantity,
    unitPrice,
    subtotal,
    tax,
    shipping,
    total,
    totalCents,
  };
}

function cleanOrder(order: Record<string, unknown>) {
  const totalCents =
    typeof order.total_cents === "number"
      ? order.total_cents
      : typeof order.total === "number"
        ? Math.round(order.total * 100)
        : 0;

  return {
    ...order,
    businessId: order.business_id,
    total_cents: totalCents,
    total:
      typeof order.total === "number" ? order.total : Number(totalCents) / 100,
    payment_status:
      order.payment_status ||
      order.status ||
      "pending",
    fulfillment_status:
      order.fulfillment_status ||
      "unfulfilled",
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackOrderEvent(params: {
  businessId: string;
  event: string;
  orderId?: string;
  revenue?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "orders",
      order_id: params.orderId ?? null,
      revenue: params.revenue ?? 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Order analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const orderId = searchParams.get("id");
    const paymentStatus = searchParams.get("payment_status") || searchParams.get("status");
    const fulfillmentStatus = searchParams.get("fulfillment_status");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId is required.",
        },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("orders")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (orderId) query = query.eq("id", orderId);
    if (paymentStatus) query = query.eq("payment_status", paymentStatus);
    if (fulfillmentStatus) {
      query = query.eq("fulfillment_status", fulfillmentStatus);
    }

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `customer_email.ilike.%${search}%,customer_name.ilike.%${search}%,product_name.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      orders: Array.isArray(data) ? data.map(cleanOrder) : [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to load orders."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderBody;

    const businessId = getBusinessId(body);
    const productName = cleanString(body.product_name);
    const customerEmail = cleanString(body.customer_email);
    const customerName = cleanString(body.customer_name);
    const customerPhone = cleanString(body.customer_phone);
    const currency = cleanString(body.currency) || "USD";
    const notes = cleanString(body.notes);
    const paymentStatus = normalizePaymentStatus(
      body.payment_status || body.status
    );
    const fulfillmentStatus = normalizeFulfillmentStatus(
      body.fulfillment_status
    );

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId or business_id is required.",
        },
        { status: 400 }
      );
    }

    if (!productName) {
      return NextResponse.json(
        {
          success: false,
          error: "product_name is required.",
        },
        { status: 400 }
      );
    }

    const totals = calculateTotals(body);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        business_id: businessId,
        customer_name: customerName || null,
        customer_email: customerEmail || null,
        customer_phone: customerPhone || null,
        product_id: cleanString(body.product_id) || null,
        product_name: productName,
        quantity: totals.quantity,
        unit_price: totals.unitPrice,
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total,
        total_cents: totals.totalCents,
        currency,
        payment_status: paymentStatus,
        status: paymentStatus,
        fulfillment_status: fulfillmentStatus,
        stripe_checkout_session_id:
          cleanString(body.stripe_checkout_session_id) || null,
        stripe_payment_intent_id:
          cleanString(body.stripe_payment_intent_id) || null,
        notes: notes || null,
        metadata: {
          ...(body.metadata ?? {}),
          createdFrom: "orders_api",
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackOrderEvent({
      businessId,
      event: "order_created",
      orderId: data.id,
      revenue:
        paymentStatus === "paid" ||
        paymentStatus === "completed" ||
        paymentStatus === "succeeded"
          ? totals.total
          : 0,
      metadata: {
        paymentStatus,
        fulfillmentStatus,
        productName,
        total: totals.total,
        totalCents: totals.totalCents,
      },
    });

    return NextResponse.json(
      {
        success: true,
        order: cleanOrder(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to create order."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as OrderBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.customer_name !== undefined) {
      updates.customer_name = cleanString(body.customer_name) || null;
    }

    if (body.customer_email !== undefined) {
      updates.customer_email = cleanString(body.customer_email) || null;
    }

    if (body.customer_phone !== undefined) {
      updates.customer_phone = cleanString(body.customer_phone) || null;
    }

    if (body.product_id !== undefined) {
      updates.product_id = cleanString(body.product_id) || null;
    }

    if (body.product_name !== undefined) {
      const productName = cleanString(body.product_name);

      if (!productName) {
        return NextResponse.json(
          {
            success: false,
            error: "product_name cannot be empty.",
          },
          { status: 400 }
        );
      }

      updates.product_name = productName;
    }

    if (body.quantity !== undefined) {
      updates.quantity = normalizeInteger(body.quantity);
    }

    if (body.unit_price !== undefined) {
      updates.unit_price = normalizeMoney(body.unit_price);
    }

    if (body.subtotal !== undefined) {
      updates.subtotal = normalizeMoney(body.subtotal);
    }

    if (body.tax !== undefined) {
      updates.tax = normalizeMoney(body.tax);
    }

    if (body.shipping !== undefined) {
      updates.shipping = normalizeMoney(body.shipping);
    }

    if (body.total !== undefined) {
      const total = normalizeMoney(body.total);
      updates.total = total;
      updates.total_cents = Math.round(total * 100);
    }

    if (body.total_cents !== undefined) {
      const totalCents = Math.round(normalizeMoney(body.total_cents));
      updates.total_cents = totalCents;
      updates.total = totalCents / 100;
    }

    if (body.currency !== undefined) {
      updates.currency = cleanString(body.currency) || "USD";
    }

    if (body.payment_status !== undefined || body.status !== undefined) {
      const paymentStatus = normalizePaymentStatus(
        body.payment_status || body.status
      );

      updates.payment_status = paymentStatus;
      updates.status = paymentStatus;
    }

    if (body.fulfillment_status !== undefined) {
      updates.fulfillment_status = normalizeFulfillmentStatus(
        body.fulfillment_status
      );
    }

    if (body.stripe_checkout_session_id !== undefined) {
      updates.stripe_checkout_session_id =
        cleanString(body.stripe_checkout_session_id) || null;
    }

    if (body.stripe_payment_intent_id !== undefined) {
      updates.stripe_payment_intent_id =
        cleanString(body.stripe_payment_intent_id) || null;
    }

    if (body.notes !== undefined) {
      updates.notes = cleanString(body.notes) || null;
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No order updates provided.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackOrderEvent({
      businessId: String(data.business_id),
      event: "order_updated",
      orderId: data.id,
      revenue:
        data.payment_status === "paid" ||
        data.payment_status === "completed" ||
        data.payment_status === "succeeded"
          ? Number(data.total ?? 0)
          : 0,
      metadata: {
        updatedFields: Object.keys(updates),
        paymentStatus: data.payment_status,
        fulfillmentStatus: data.fulfillment_status,
      },
    });

    return NextResponse.json({
      success: true,
      order: cleanOrder(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to update order."),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idFromSearch = searchParams.get("id");

    let id = idFromSearch;

    if (!id) {
      const body = (await request.json().catch(() => null)) as
        | { id?: string }
        | null;

      id = body?.id ?? null;
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: order, error: loadError } = await supabaseAdmin
      .from("orders")
      .select("id, business_id, payment_status, status, total")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin.from("orders").delete().eq("id", id);

    if (error) throw error;

    if (order?.business_id) {
      await trackOrderEvent({
        businessId: order.business_id,
        event: "order_deleted",
        orderId: id,
        metadata: {
          paymentStatus: order.payment_status || order.status,
          total: order.total,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Failed to delete order."),
      },
      { status: 500 }
    );
  }
}