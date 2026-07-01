import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type AgentRole =
  | "AI Sales Manager"
  | "AI Support Agent"
  | "AI Marketing Assistant"
  | "AI Operations Manager"
  | "AI Business Assistant";

type AgentTone =
  | "professional"
  | "friendly"
  | "luxury"
  | "direct"
  | "playful"
  | "premium";

type AgentBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  name?: string;
  role?: AgentRole | string;
  tone?: AgentTone | string;
  openingMessage?: string;
  opening_message?: string;
  instructions?: string;
  knowledge?: string;
  avatar_url?: string | null;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: AgentBody) {
  return normalizeString(body.businessId || body.business_id);
}

function getOpeningMessage(body: AgentBody) {
  return normalizeString(body.openingMessage || body.opening_message);
}

function normalizeRole(value: unknown): AgentRole {
  const role = normalizeString(value);

  if (
    role === "AI Sales Manager" ||
    role === "AI Support Agent" ||
    role === "AI Marketing Assistant" ||
    role === "AI Operations Manager" ||
    role === "AI Business Assistant"
  ) {
    return role;
  }

  return "AI Sales Manager";
}

function normalizeTone(value: unknown): AgentTone {
  const tone = normalizeString(value).toLowerCase();

  if (
    tone === "professional" ||
    tone === "friendly" ||
    tone === "luxury" ||
    tone === "direct" ||
    tone === "playful" ||
    tone === "premium"
  ) {
    return tone;
  }

  return "professional";
}

function getDefaultOpeningMessage(role: AgentRole) {
  if (role === "AI Support Agent") {
    return "Hi! I’m your AI support assistant. How can I help you today?";
  }

  if (role === "AI Marketing Assistant") {
    return "Hi! I’m your AI marketing assistant. I can help with campaigns, content, and growth ideas.";
  }

  if (role === "AI Operations Manager") {
    return "Hi! I’m your AI operations assistant. I can help organize tasks, workflows, and business systems.";
  }

  if (role === "AI Business Assistant") {
    return "Hi! I’m your AI business assistant. How can I help you move the business forward today?";
  }

  return "Hi! I’m your AI sales assistant. I can answer questions, recommend offers, and help customers take the next step.";
}

function getDefaultInstructions(role: AgentRole, tone: AgentTone) {
  const base = `You are a ${role} for this CreatorOS AI business. Use a ${tone} tone.`;

  if (role === "AI Support Agent") {
    return `${base} Answer customer questions clearly, explain products or services, solve simple issues, and escalate anything that needs a human.`;
  }

  if (role === "AI Marketing Assistant") {
    return `${base} Help create campaign ideas, social captions, email copy, content angles, hooks, and promotional strategies.`;
  }

  if (role === "AI Operations Manager") {
    return `${base} Help organize internal tasks, workflows, automations, customer follow-up, and business systems.`;
  }

  if (role === "AI Business Assistant") {
    return `${base} Help with planning, product ideas, customer questions, offers, operations, and growth.`;
  }

  return `${base} Answer product questions, qualify leads, recommend the best offer, overcome objections respectfully, and guide customers toward checkout.`;
}

function cleanAgent(agent: Record<string, unknown>) {
  return {
    ...agent,
    openingMessage: agent.opening_message,
    businessId: agent.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const agentId = searchParams.get("id");
    const active = searchParams.get("active");

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

    let query = supabaseAdmin
      .from("ai_agents")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (agentId) {
      query = query.eq("id", agentId);
    }

    if (active === "true") {
      query = query.eq("is_active", true);
    }

    if (active === "false") {
      query = query.eq("is_active", false);
    }

    const { data, error } = await query;

    if (error) throw error;

    const agents = Array.isArray(data)
      ? data.map((agent) => cleanAgent(agent))
      : [];

    return NextResponse.json({
      success: true,
      agents,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load AI agents."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentBody;

    const businessId = getBusinessId(body);
    const role = normalizeRole(body.role);
    const tone = normalizeTone(body.tone);
    const name = normalizeString(body.name) || "CreatorOS AI Agent";

    const openingMessage =
      getOpeningMessage(body) || getDefaultOpeningMessage(role);

    const instructions =
      normalizeString(body.instructions) || getDefaultInstructions(role, tone);

    const knowledge = normalizeString(body.knowledge);

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

    const { data, error } = await supabaseAdmin
      .from("ai_agents")
      .insert({
        business_id: businessId,
        name,
        role,
        tone,
        opening_message: openingMessage,
        instructions,
        knowledge: knowledge || null,
        avatar_url: body.avatar_url ?? null,
        is_active: body.is_active ?? true,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        agent: cleanAgent(data),
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create AI agent."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentBody;

    const id = normalizeString(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Agent ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.name !== undefined) {
      const name = normalizeString(body.name);

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: "Agent name cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      updates.name = name;
    }

    if (body.role !== undefined) {
      updates.role = normalizeRole(body.role);
    }

    if (body.tone !== undefined) {
      updates.tone = normalizeTone(body.tone);
    }

    if (body.openingMessage !== undefined || body.opening_message !== undefined) {
      updates.opening_message = getOpeningMessage(body);
    }

    if (body.instructions !== undefined) {
      updates.instructions = normalizeString(body.instructions);
    }

    if (body.knowledge !== undefined) {
      const knowledge = normalizeString(body.knowledge);
      updates.knowledge = knowledge || null;
    }

    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url;
    }

    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No agent updates provided.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ai_agents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      agent: cleanAgent(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update AI agent."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Agent ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabaseAdmin.from("ai_agents").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete AI agent."),
      },
      {
        status: 500,
      }
    );
  }
}