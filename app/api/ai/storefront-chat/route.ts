import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type StorefrontChatBody = {
  businessId?: string;
  business_id?: string;
  conversationId?: string;
  conversation_id?: string;
  message?: string;
  messages?: ChatMessage[];
  customerName?: string;
  customerEmail?: string;
  source?: string;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: StorefrontChatBody) {
  return cleanString(body.businessId || body.business_id);
}

function getConversationId(body: StorefrontChatBody) {
  return cleanString(body.conversationId || body.conversation_id);
}

function getFaqText(generatedData: unknown) {
  if (
    !generatedData ||
    typeof generatedData !== "object" ||
    !("faq" in generatedData)
  ) {
    return "No FAQ saved yet.";
  }

  const faq = (generatedData as { faq?: unknown }).faq;

  if (!Array.isArray(faq)) return "No FAQ saved yet.";

  return faq
    .map((item) => {
      if (!item || typeof item !== "object") return "";

      const question = cleanString((item as { question?: unknown }).question);
      const answer = cleanString((item as { answer?: unknown }).answer);

      if (!question && !answer) return "";

      return `Q: ${question}\nA: ${answer}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function buildProductContext(products: Record<string, unknown>[]) {
  if (!products.length) return "No active products are currently listed.";

  return products
    .map((product) => {
      const name = cleanString(product.name);
      const description = cleanString(product.description);
      const type = cleanString(product.type);
      const currency = cleanString(product.currency) || "USD";

      const priceCents =
        typeof product.price_cents === "number" ? product.price_cents : 0;

      const price = (priceCents / 100).toFixed(2);

      return [
        `Product: ${name}`,
        `Type: ${type || "product"}`,
        `Price: ${currency} ${price}`,
        description ? `Description: ${description}` : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

async function trackEvent(params: {
  businessId: string;
  event: string;
  conversationId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "storefront_ai_chat",
      conversation_id: params.conversationId || null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Analytics tracking failed:", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as StorefrontChatBody;

    const businessId = getBusinessId(body);
    const conversationId = getConversationId(body);
    const message = cleanString(body.message);
    const source = cleanString(body.source) || "storefront";

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    const [businessResult, agentResult, productsResult] = await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single(),

      supabaseAdmin
        .from("ai_agents")
        .select("*")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1),

      supabaseAdmin
        .from("products")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "active")
        .order("created_at", { ascending: true }),
    ]);

    if (businessResult.error || !businessResult.data) {
      return NextResponse.json(
        { success: false, error: "Business not found." },
        { status: 404 }
      );
    }

    if (agentResult.error) throw agentResult.error;
    if (productsResult.error) throw productsResult.error;

    const business = businessResult.data as Record<string, unknown>;
    const agent = (agentResult.data?.[0] ?? null) as Record<
      string,
      unknown
    > | null;

    const products = (productsResult.data ?? []) as Record<string, unknown>[];

    const businessName = cleanString(business.name) || "this business";
    const businessDescription = cleanString(business.description);
    const industry = cleanString(business.industry);
    const audience = cleanString(business.audience);

    const agentName = cleanString(agent?.name) || "CreatorOS AI";
    const agentRole = cleanString(agent?.role) || "AI Sales Assistant";
    const agentInstructions =
      cleanString(agent?.instructions) ||
      "Answer customer questions, recommend products, capture leads, and guide people toward checkout.";

    const productContext = buildProductContext(products);
    const faqContext = getFaqText(business.generated_data);

    const history = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (item) =>
              (item.role === "user" || item.role === "assistant") &&
              cleanString(item.content)
          )
          .slice(-12)
      : [];

    const systemPrompt = `
You are ${agentName}, a ${agentRole} for ${businessName}.

Business:
Name: ${businessName}
Industry: ${industry || "Not specified"}
Audience: ${audience || "Not specified"}
Description: ${businessDescription || "No description provided."}

Your instructions:
${agentInstructions}

Active products:
${productContext}

FAQ:
${faqContext}

Rules:
- Be helpful, clear, and sales-focused without being pushy.
- If the customer asks about pricing, products, services, or checkout, use the product context.
- If you do not know something, say that and suggest they submit the lead form.
- Keep replies concise unless the customer asks for detail.
- Do not invent policies, guarantees, inventory, or delivery timelines.
- End with a helpful next step when appropriate.
`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        {
          role: "user",
          content: message,
        },
      ],
    });

    const reply =
      completion.choices[0]?.message?.content?.trim() ||
      "Thanks for reaching out. I can help answer questions about this business and its offers.";

    let savedConversationId = conversationId;

    const savedMessages = [
      ...history,
      {
        role: "user",
        content: message,
      },
      {
        role: "assistant",
        content: reply,
      },
    ];

    if (conversationId) {
      const { data, error } = await supabaseAdmin
        .from("conversations")
        .update({
          last_message: reply,
          status: "open",
          metadata: {
            source,
            businessName,
            agentName,
            messages: savedMessages,
            updatedFrom: "storefront_ai_chat",
          },
        })
        .eq("id", conversationId)
        .eq("business_id", businessId)
        .select("id")
        .single();

      if (error) throw error;

      savedConversationId = data.id;
    } else {
      const { data, error } = await supabaseAdmin
        .from("conversations")
        .insert({
          business_id: businessId,
          customer_name: cleanString(body.customerName) || "Storefront Visitor",
          customer_email: cleanString(body.customerEmail) || null,
          channel: "storefront",
          status: "open",
          subject: `AI chat with ${businessName}`,
          last_message: reply,
          metadata: {
            source,
            businessName,
            agentName,
            messages: savedMessages,
            createdFrom: "storefront_ai_chat",
          },
        })
        .select("id")
        .single();

      if (error) throw error;

      savedConversationId = data.id;

      await trackEvent({
        businessId,
        event: "storefront_chat_started",
        conversationId: savedConversationId,
        metadata: {
          businessName,
          agentName,
        },
      });
    }

    await trackEvent({
      businessId,
      event: "storefront_chat_message",
      conversationId: savedConversationId,
      metadata: {
        businessName,
        agentName,
        messageLength: message.length,
        replyLength: reply.length,
      },
    });

    return NextResponse.json({
      success: true,
      reply,
      conversationId: savedConversationId,
    });
  } catch (error) {
    console.error("Storefront chat error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate storefront chat response.",
      },
      { status: 500 }
    );
  }
}