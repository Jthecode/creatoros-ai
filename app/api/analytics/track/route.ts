import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type AnalyticsEvent =
  | "page_view"
  | "dashboard_view"
  | "storefront_view"
  | "product_view"
  | "product_purchase"
  | "checkout_started"
  | "checkout_completed"
  | "lead_created"
  | "conversation_started"
  | "conversation_message"
  | "ai_generation"
  | "automation_run"
  | "marketplace_install"
  | "file_upload"
  | "login"
  | "signup"
  | "custom";

type AnalyticsBody = {
  businessId?: string;
  business_id?: string;

  event?: AnalyticsEvent | string;

  page?: string;
  source?: string;

  userId?: string;
  sessionId?: string;

  productId?: string;
  orderId?: string;
  leadId?: string;
  conversationId?: string;

  revenue?: number;

  metadata?: Record<string, unknown>;
};

function getBusinessId(body: AnalyticsBody) {
  return body.businessId || body.business_id || "";
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function cleanRevenue(value: unknown) {
  if (typeof value === "number") return value;

  const parsed = Number(value);

  if (Number.isFinite(parsed)) {
    return parsed;
  }

  return 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyticsBody;

    const businessId = getBusinessId(body);

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

    const { error } = await supabaseAdmin
      .from("analytics_events")
      .insert({
        business_id: businessId,

        event: cleanString(body.event) || "custom",

        page: cleanString(body.page) || null,

        source: cleanString(body.source) || null,

        user_id: cleanString(body.userId) || null,

        session_id: cleanString(body.sessionId) || null,

        product_id: cleanString(body.productId) || null,

        order_id: cleanString(body.orderId) || null,

        lead_id: cleanString(body.leadId) || null,

        conversation_id:
          cleanString(body.conversationId) || null,

        revenue: cleanRevenue(body.revenue),

        metadata: body.metadata ?? {},
      });

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to track analytics event.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");

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

    const event = searchParams.get("event");

    let query = supabaseAdmin
      .from("analytics_events")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (event) {
      query = query.eq("event", event);
    }

    const { data, error } = await query;

    if (error) throw error;

    const analytics = data ?? [];

    const totalEvents = analytics.length;

    const revenue = analytics.reduce((sum, item) => {
      return sum + Number(item.revenue ?? 0);
    }, 0);

    const eventCounts = analytics.reduce<
      Record<string, number>
    >((acc, item) => {
      const key = item.event ?? "unknown";

      acc[key] = (acc[key] ?? 0) + 1;

      return acc;
    }, {});

    return NextResponse.json({
      success: true,

      totalEvents,

      revenue,

      eventCounts,

      analytics,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load analytics.",
      },
      {
        status: 500,
      }
    );
  }
}