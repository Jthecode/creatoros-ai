import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type CreateOrderBody = {
  business_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  product_id?: string;
  product_name: string;
  quantity?: number;
  unit_price: number;
  subtotal?: number;
  tax?: number;
  shipping?: number;
  total?: number;
  currency?: string;
  payment_status?: "pending" | "paid" | "failed" | "refunded";
  fulfillment_status?:
    | "unfulfilled"
    | "processing"
    | "shipped"
    | "delivered"
    | "cancelled";
  notes?: string;
};

function calculateTotals(body: CreateOrderBody) {
  const quantity = body.quantity ?? 1;
  const subtotal = body.subtotal ?? quantity * body.unit_price;
  const tax = body.tax ?? 0;
  const shipping = body.shipping ?? 0;
  const total = body.total ?? subtotal + tax + shipping;

  return {
    quantity,
    subtotal,
    tax,
    shipping,
    total,
  };
}

/*
|--------------------------------------------------------------------------
| GET
|--------------------------------------------------------------------------
*/

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const businessId = searchParams.get("businessId");
    const orderId = searchParams.get("id");

    if (!businessId) {
      return NextResponse.json(
        {
          error: "businessId is required",
        },
        {
          status: 400,
        }
      );
    }

    let query = supabaseAdmin
      .from("orders")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (orderId) {
      query = query.eq("id", orderId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      orders: data ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to load orders",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| POST
|--------------------------------------------------------------------------
*/

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateOrderBody;

    if (!body.business_id) {
      return NextResponse.json(
        {
          error: "business_id is required",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.product_name) {
      return NextResponse.json(
        {
          error: "product_name is required",
        },
        {
          status: 400,
        }
      );
    }

    const totals = calculateTotals(body);

    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        business_id: body.business_id,
        customer_name: body.customer_name ?? null,
        customer_email: body.customer_email ?? null,
        customer_phone: body.customer_phone ?? null,
        product_id: body.product_id ?? null,
        product_name: body.product_name,
        quantity: totals.quantity,
        unit_price: body.unit_price,
        subtotal: totals.subtotal,
        tax: totals.tax,
        shipping: totals.shipping,
        total: totals.total,
        currency: body.currency ?? "USD",
        payment_status: body.payment_status ?? "pending",
        fulfillment_status:
          body.fulfillment_status ?? "unfulfilled",
        notes: body.notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create order",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| PATCH
|--------------------------------------------------------------------------
*/

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        {
          error: "Order id required",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({
        ...body,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update order",
      },
      {
        status: 500,
      }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.id) {
      return NextResponse.json(
        {
          error: "Order id required",
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("id", body.id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete order",
      },
      {
        status: 500,
      }
    );
  }
}