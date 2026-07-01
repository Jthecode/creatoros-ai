import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type AgentRole =
  | "AI Sales Assistant"
  | "AI Sales Manager"
  | "AI Support Agent"
  | "AI Marketing Assistant"
  | "AI Operations Manager"
  | "AI Business Assistant"
  | "AI Lead Qualifier"
  | "AI Onboarding Assistant"
  | "AI Product Expert"
  | "AI Business Operator";

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
  isActive?: boolean;
  is_active?: boolean;
  metadata?: Record<string, unknown> | null;
};

const roles: AgentRole[] = [
  "AI Sales Assistant",
  "AI Sales Manager",
  "AI Support Agent",
  "AI Marketing Assistant",
  "AI Operations Manager",
  "AI Business Assistant",
  "AI Lead Qualifier",
  "AI Onboarding Assistant",
  "AI Product Expert",
  "AI Business Operator",
];

const tones: AgentTone[] = [
  "professional",
  "friendly",
  "luxury",
  "direct",
  "playful",
  "premium",
];

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: AgentBody) {
  return cleanString(body.businessId || body.business_id);
}

function getOpeningMessage(body: AgentBody) {
  return cleanString(body.openingMessage || body.opening_message);
}

function normalizeRole(value: unknown): AgentRole {
  const role = cleanString(value) as AgentRole;
  return roles.includes(role) ? role : "AI Sales Assistant";
}

function normalizeTone(value: unknown): AgentTone {
  const tone = cleanString(value).toLowerCase() as AgentTone;
  return tones.includes(tone) ? tone : "professional";
}

function normalizeActive(body: AgentBody) {
  if (typeof body.isActive === "boolean") return body.isActive;
  if (typeof body.is_active === "boolean") return body.is_active;
  return true;
}

function getDefaultOpeningMessage(role: AgentRole) {
  if (role === "AI Support Agent") {
    return "Hi! I’m your AI support assistant. How can I help you today?";
  }

  if (role === "AI Marketing Assistant") {
    return "Hi! I’m your AI marketing assistant. I can help with campaigns, content, and growth ideas.";
  }

  if (role === "AI Operations Manager" || role === "AI Business Operator") {
    return "Hi! I’m your AI operations assistant. I can help organize tasks, workflows, and business systems.";
  }

  if (role === "AI Lead Qualifier") {
    return "Hi! I can help you find the right offer and collect the details needed for the next step.";
  }

  if (role === "AI Onboarding Assistant") {
    return "Hi! I can help you get started and guide you through the next steps.";
  }

  if (role === "AI Product Expert") {
    return "Hi! I can help explain products, compare options, and recommend the best fit.";
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

  if (role === "AI Operations Manager" || role === "AI Business Operator") {
    return `${base} Help organize internal tasks, workflows, automations, customer follow-up, and business systems.`;
  }

  if (role === "AI Lead Qualifier") {
    return `${base} Ask helpful questions, qualify the customer, collect lead details, and guide serious buyers to the right next step.`;
  }

  if (role === "AI Onboarding Assistant") {
    return `${base} Help new customers understand what to do first, explain setup steps, and reduce confusion.`;
  }

  if (role === "AI Product Expert") {
    return `${base} Explain products clearly, compare options, recommend the best fit, and answer objections.`;
  }

  return `${base} Answer product questions, qualify leads, recommend the best offer, overcome objections respectfully, and guide customers toward checkout.`;
}

function cleanAgent(agent: Record<string, unknown>) {
  return {
    ...agent,
    businessId: agent.business_id,
    openingMessage: agent.opening_message,
    isActive: agent.is_active,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackAgentEvent(params: {
  businessId: string;
  event: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "ai_agents",
      ai_agent_id: params.agentId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("AI agent analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const agentId = searchParams.get("id");
    const active = searchParams.get("active");
    const role = searchParams.get("role");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("ai_agents")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (agentId) query = query.eq("id", agentId);
    if (role) query = query.eq("role", role);
    if (active === "true") query = query.eq("is_active", true);
    if (active === "false") query = query.eq("is_active", false);

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,role.ilike.%${search}%,opening_message.ilike.%${search}%,instructions.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      agents: Array.isArray(data) ? data.map(cleanAgent) : [],
    });
  } catch (error) {
    console.error("AI agents GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load AI agents."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentBody;

    const businessId = getBusinessId(body);
    const role = normalizeRole(body.role);
    const tone = normalizeTone(body.tone);
    const name = cleanString(body.name) || "CreatorOS AI Employee";
    const openingMessage =
      getOpeningMessage(body) || getDefaultOpeningMessage(role);
    const instructions =
      cleanString(body.instructions) || getDefaultInstructions(role, tone);
    const knowledge = cleanString(body.knowledge);
    const isActive = normalizeActive(body);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
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
        is_active: isActive,
        metadata: {
          ...(body.metadata ?? {}),
          createdFrom: "ai_agents_api",
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackAgentEvent({
      businessId,
      event: "ai_agent_created",
      agentId: data.id,
      metadata: {
        role,
        tone,
        isActive,
      },
    });

    return NextResponse.json(
      {
        success: true,
        agent: cleanAgent(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("AI agents POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create AI agent."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as AgentBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.name !== undefined) {
      const name = cleanString(body.name);

      if (!name) {
        return NextResponse.json(
          { success: false, error: "Agent name cannot be empty." },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.role !== undefined) updates.role = normalizeRole(body.role);
    if (body.tone !== undefined) updates.tone = normalizeTone(body.tone);

    if (
      body.openingMessage !== undefined ||
      body.opening_message !== undefined
    ) {
      updates.opening_message = getOpeningMessage(body);
    }

    if (body.instructions !== undefined) {
      updates.instructions = cleanString(body.instructions);
    }

    if (body.knowledge !== undefined) {
      const knowledge = cleanString(body.knowledge);
      updates.knowledge = knowledge || null;
    }

    if (body.avatar_url !== undefined) {
      updates.avatar_url = body.avatar_url;
    }

    if (body.isActive !== undefined || body.is_active !== undefined) {
      updates.is_active = normalizeActive(body);
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No agent updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ai_agents")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackAgentEvent({
      businessId: String(data.business_id),
      event: "ai_agent_updated",
      agentId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
        role: data.role,
        isActive: data.is_active,
      },
    });

    return NextResponse.json({
      success: true,
      agent: cleanAgent(data),
    });
  } catch (error) {
    console.error("AI agents PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update AI agent."),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Agent ID is required." },
        { status: 400 }
      );
    }

    const { data: agent, error: loadError } = await supabaseAdmin
      .from("ai_agents")
      .select("id, business_id, role, is_active")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin
      .from("ai_agents")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (agent?.business_id) {
      await trackAgentEvent({
        businessId: agent.business_id,
        event: "ai_agent_deleted",
        agentId: id,
        metadata: {
          role: agent.role,
          isActive: agent.is_active,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("AI agents DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete AI agent."),
      },
      { status: 500 }
    );
  }
}