import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type OrderRow = {
  id: string;
  total_cents: number | null;
  customer_email: string | null;
  status: string | null;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const [
      businessResult,
      productsResult,
      agentsResult,
      ordersResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id, name, slug, status")
        .eq("id", id)
        .single(),

      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id),

      supabaseAdmin
        .from("ai_agents")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id),

      supabaseAdmin
        .from("orders")
        .select("id, total_cents, customer_email, status")
        .eq("business_id", id),
    ]);

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    if (productsResult.error) throw productsResult.error;
    if (agentsResult.error) throw agentsResult.error;
    if (ordersResult.error) throw ordersResult.error;

    const orders = (ordersResult.data ?? []) as OrderRow[];
    const paidOrders = orders.filter((order) => order.status === "paid");

    const revenue = paidOrders.reduce(
      (sum, order) => sum + Number(order.total_cents ?? 0),
      0
    );

    const customers = new Set(
      orders.map((order) => order.customer_email).filter(Boolean)
    );

    const stats = {
      revenue,
      revenueFormatted: formatCurrency(revenue),
      orders: orders.length,
      paidOrders: paidOrders.length,
      customers: customers.size,
      products: productsResult.count ?? 0,
      aiAgents: agentsResult.count ?? 0,
      visitors: 0,
      conversionRate: orders.length > 0 ? 100 : 0,
      tasks: 0,
    };

    return NextResponse.json({
      success: true,
      business: businessResult.data,
      stats,
    });
  } catch (error) {
    console.error("Business stats error:", error);

    return NextResponse.json(
      { error: "Unable to load business stats." },
      { status: 500 }
    );
  }
}