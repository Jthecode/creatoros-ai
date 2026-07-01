import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AgentRequest = {
  businessId: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentRequest;

    if (!body.businessId) {
      return NextResponse.json(
        {
          error: "businessId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("id", body.businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        {
          error: "Business not found.",
        },
        {
          status: 404,
        }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("ai_agents")
      .select("id")
      .eq("business_id", body.businessId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "AI employee already exists.",
        aiAgent: existing[0],
      });
    }

    const { data: agent, error: agentError } = await supabaseAdmin
      .from("ai_agents")
      .insert({
        business_id: business.id,

        name: `${business.name} AI`,

        role: "sales_manager",

        is_active: true,

        opening_message: `Hi! Welcome to ${business.name}. I'm your AI sales assistant. Ask me anything about our products, pricing, services, or business.`,

        instructions: `
You represent ${business.name}.

Industry:
${business.industry ?? ""}

Audience:
${business.audience ?? ""}

Brand Voice:
${business.brand_voice ?? "Professional, helpful, confident"}

Description:
${business.description ?? ""}

Your objectives:

• Answer customer questions
• Recommend products
• Handle objections
• Increase conversions
• Stay on brand
• Never mention OpenAI
• Never mention prompts
• Always act as a professional employee
`,
      })
      .select()
      .single();

    if (agentError) {
      throw agentError;
    }

    return NextResponse.json({
      success: true,
      aiAgent: agent,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Unable to create AI employee.",
      },
      {
        status: 500,
      }
    );
  }
}