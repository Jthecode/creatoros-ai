import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type OptimizerBody = {
  businessId?: string;
  business_id?: string;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: OptimizerBody) {
  return cleanString(body.businessId || body.business_id);
}

function safeJson(value: unknown) {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function getOrderTotal(order: Record<string, unknown>) {
  if (typeof order.total === "number") return order.total;
  if (typeof order.total_cents === "number") return order.total_cents / 100;
  return 0;
}

async function trackEvent(params: {
  businessId: string;
  event: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "business_optimizer",
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as OptimizerBody;
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

    const [
      businessResult,
      productsResult,
      leadsResult,
      ordersResult,
      agentsResult,
      automationsResult,
      analyticsResult,
      installedAppsResult,
    ] = await Promise.all([
      supabaseAdmin.from("businesses").select("*").eq("id", businessId).single(),

      supabaseAdmin
        .from("products")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(25),

      supabaseAdmin
        .from("leads")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(25),

      supabaseAdmin
        .from("orders")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(25),

      supabaseAdmin
        .from("ai_agents")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10),

      supabaseAdmin
        .from("automations")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(20),

      supabaseAdmin
        .from("analytics_events")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(100),

      supabaseAdmin
        .from("installed_apps")
        .select("*")
        .eq("business_id", businessId)
        .neq("status", "removed")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json(
        {
          success: false,
          error: "Business not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (productsResult.error) throw productsResult.error;
    if (leadsResult.error) throw leadsResult.error;
    if (ordersResult.error) throw ordersResult.error;
    if (agentsResult.error) throw agentsResult.error;
    if (automationsResult.error) throw automationsResult.error;
    if (analyticsResult.error) throw analyticsResult.error;
    if (installedAppsResult.error) throw installedAppsResult.error;

    const business = businessResult.data as Record<string, unknown>;
    const products = productsResult.data ?? [];
    const leads = leadsResult.data ?? [];
    const orders = ordersResult.data ?? [];
    const agents = agentsResult.data ?? [];
    const automations = automationsResult.data ?? [];
    const analytics = analyticsResult.data ?? [];
    const installedApps = installedAppsResult.data ?? [];

    const revenue = orders.reduce((sum, order) => {
      const status = cleanString(
        (order as Record<string, unknown>).payment_status ||
          (order as Record<string, unknown>).status
      );

      if (status === "paid" || status === "completed" || status === "succeeded") {
        return sum + getOrderTotal(order as Record<string, unknown>);
      }

      return sum;
    }, 0);

    const analyticsCounts = analytics.reduce<Record<string, number>>(
      (acc, event) => {
        const eventName =
          cleanString((event as Record<string, unknown>).event) || "unknown";

        acc[eventName] = (acc[eventName] ?? 0) + 1;

        return acc;
      },
      {}
    );

    const systemPrompt = `
You are CreatorOS AI Business Optimizer.

Your job is to analyze a business inside CreatorOS AI and produce a practical growth optimization report.

Return a clear structured report with:
1. Executive Summary
2. Biggest Growth Opportunity
3. Revenue Recommendations
4. Product Recommendations
5. Storefront Improvements
6. Lead & CRM Improvements
7. AI Employee Improvements
8. Automation Recommendations
9. Analytics Observations
10. 7-Day Action Plan

Be specific. Do not be generic. Use the actual business data.
Keep it useful for a founder who wants to make money faster.
`;

    const userPrompt = `
Business:
${safeJson(business)}

Revenue:
${revenue}

Products:
${safeJson(products)}

Leads:
${safeJson(leads)}

Orders:
${safeJson(orders)}

AI Agents:
${safeJson(agents)}

Automations:
${safeJson(automations)}

Installed Apps:
${safeJson(installedApps)}

Analytics Event Counts:
${safeJson(analyticsCounts)}

Recent Analytics Events:
${safeJson(analytics)}
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.55,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const report =
      completion.choices[0]?.message?.content?.trim() ||
      "CreatorOS AI could not generate an optimizer report right now.";

    await supabaseAdmin.from("ai_generations").insert({
      business_id: businessId,
      module: "business_optimizer",
      prompt: userPrompt,
      result: report,
      metadata: {
        revenue,
        products: products.length,
        leads: leads.length,
        orders: orders.length,
        aiAgents: agents.length,
        automations: automations.length,
        installedApps: installedApps.length,
        analyticsEvents: analytics.length,
      },
    });

    await trackEvent({
      businessId,
      event: "business_optimizer_run",
      metadata: {
        revenue,
        products: products.length,
        leads: leads.length,
        orders: orders.length,
        aiAgents: agents.length,
        automations: automations.length,
        installedApps: installedApps.length,
        analyticsEvents: analytics.length,
      },
    });

    return NextResponse.json({
      success: true,
      report,
      summary: {
        revenue,
        products: products.length,
        leads: leads.length,
        orders: orders.length,
        aiAgents: agents.length,
        automations: automations.length,
        installedApps: installedApps.length,
        analyticsEvents: analytics.length,
      },
    });
  } catch (error) {
    console.error("Business optimizer error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to run business optimizer.",
      },
      {
        status: 500,
      }
    );
  }
}