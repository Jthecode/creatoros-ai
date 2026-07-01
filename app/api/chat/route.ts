import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { businessId, message } = body;

    if (!businessId) {
      return NextResponse.json(
        {
          error: "Business ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!message) {
      return NextResponse.json(
        {
          error: "Message is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data: business, error: businessError } =
      await supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("id", businessId)
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

    const { data: products } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("business_id", businessId);

    const { data: agents } = await supabaseAdmin
      .from("ai_agents")
      .select("*")
      .eq("business_id", businessId)
      .limit(1);

    const agent = agents?.[0];

    const systemPrompt = `
You are the AI employee for ${business.name}.

Business Description:
${business.description ?? ""}

Industry:
${business.industry ?? ""}

Audience:
${business.audience ?? ""}

Brand Voice:
${business.brand_voice ?? ""}

Storefront Headline:
${business.storefront_headline ?? ""}

AI Role:
${agent?.role ?? "AI Sales Manager"}

AI Instructions:
${agent?.instructions ?? ""}

Opening Message:
${agent?.opening_message ?? ""}

Products:

${JSON.stringify(products, null, 2)}

Your job is to:

• Answer questions naturally.
• Sell products.
• Recommend the best product.
• Handle objections.
• Act like a professional sales employee.
• Never mention OpenAI.
• Never say you're an AI language model.
• Stay on brand.
`;

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: message,
          },
        ],
      });

    return NextResponse.json({
      success: true,
      reply:
        completion.choices[0].message.content ??
        "I'm sorry, I couldn't answer that.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Chat failed.",
      },
      {
        status: 500,
      }
    );
  }
}