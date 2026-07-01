import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ModuleType =
  | "products"
  | "marketing"
  | "content"
  | "branding"
  | "website"
  | "sales"
  | "crm"
  | "automation"
  | "finance";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const businessId = body.businessId as string | undefined;
    const moduleType = body.moduleType as ModuleType | undefined;
    const prompt = body.prompt as string | undefined;

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!moduleType) {
      return NextResponse.json(
        { error: "moduleType is required." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: "Business not found." },
        { status: 404 }
      );
    }

    const { data: products } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("business_id", businessId);

    const { data: aiAgents } = await supabaseAdmin
      .from("ai_agents")
      .select("*")
      .eq("business_id", businessId);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.85,
      response_format: {
        type: "json_object",
      },
      messages: [
        {
          role: "system",
          content:
            "You are CreatorOS AI, an elite AI business operating system. Return only valid JSON. No markdown.",
        },
        {
          role: "user",
          content: `
Generate a complete ${moduleType} module output for this business.

Business:
${JSON.stringify(business, null, 2)}

Products:
${JSON.stringify(products ?? [], null, 2)}

AI Employees:
${JSON.stringify(aiAgents ?? [], null, 2)}

Extra user request:
${prompt || "No extra request provided."}

Return JSON in this structure:
{
  "moduleType": "${moduleType}",
  "title": "",
  "summary": "",
  "recommendations": [],
  "generatedItems": [],
  "nextActions": []
}
          `,
        },
      ],
    });

    const text = completion.choices[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "OpenAI returned no response." },
        { status: 500 }
      );
    }

    const generated = JSON.parse(text);

    return NextResponse.json({
      success: true,
      generated,
    });
  } catch (error) {
    console.error("Generate module error:", error);

    return NextResponse.json(
      { error: "Unable to generate module." },
      { status: 500 }
    );
  }
}