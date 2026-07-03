import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type CommandBody = {
  businessId?: string;
  business_id?: string;
  prompt?: string;
  mode?: "plan" | "execute";
};

type CommandAction = {
  type:
    | "website"
    | "product"
    | "storefront"
    | "marketing"
    | "automation"
    | "ai_agent"
    | "lead"
    | "analytics";
  label: string;
  status: "planned" | "completed" | "failed";
  message: string;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: CommandBody) {
  return cleanString(body.businessId || body.business_id);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function detectActions(prompt: string): CommandAction[] {
  const text = prompt.toLowerCase();
  const actions: CommandAction[] = [];

  if (
    text.includes("website") ||
    text.includes("web site") ||
    text.includes("homepage") ||
    text.includes("about page") ||
    text.includes("services page") ||
    text.includes("contact page") ||
    text.includes("faq") ||
    text.includes("seo page")
  ) {
    actions.push({
      type: "website",
      label: "AI Website Builder",
      status: "planned",
      message:
        "Create website pages like Home, About, Services, FAQ, Contact, and SEO content.",
    });
  }

  if (
    text.includes("product") ||
    text.includes("offer") ||
    text.includes("service") ||
    text.includes("checkout")
  ) {
    actions.push({
      type: "product",
      label: "Product / Offer",
      status: "planned",
      message: "Create or improve a sellable product or service offer.",
    });
  }

  if (
    text.includes("storefront") ||
    text.includes("landing page") ||
    text.includes("sales page")
  ) {
    actions.push({
      type: "storefront",
      label: "Storefront",
      status: "planned",
      message: "Update public storefront copy, positioning, and sales message.",
    });
  }

  if (
    text.includes("marketing") ||
    text.includes("campaign") ||
    text.includes("social") ||
    text.includes("email") ||
    text.includes("launch")
  ) {
    actions.push({
      type: "marketing",
      label: "Marketing",
      status: "planned",
      message: "Generate marketing ideas, content angles, and launch assets.",
    });
  }

  if (
    text.includes("automation") ||
    text.includes("automate") ||
    text.includes("follow up") ||
    text.includes("workflow")
  ) {
    actions.push({
      type: "automation",
      label: "Automation",
      status: "planned",
      message: "Create workflow ideas for follow-up, sales, or operations.",
    });
  }

  if (
    text.includes("ai employee") ||
    text.includes("assistant") ||
    text.includes("sales rep") ||
    text.includes("support")
  ) {
    actions.push({
      type: "ai_agent",
      label: "AI Employee",
      status: "planned",
      message: "Create or improve an AI employee for this business.",
    });
  }

  if (actions.length === 0) {
    actions.push(
      {
        type: "website",
        label: "Website Builder",
        status: "planned",
        message: "Build or improve the public website for this business.",
      },
      {
        type: "marketing",
        label: "Growth Plan",
        status: "planned",
        message: "Create a simple growth plan from the command.",
      }
    );
  }

  return actions;
}

function buildResult(
  prompt: string,
  businessName: string,
  actions: CommandAction[]
) {
  return {
    summary: `CreatorOS AI created a command plan for ${businessName}.`,
    prompt,
    recommendedNextMove:
      "Review the plan, then use the Website Builder, Product Manager, Marketing Center, Automations, and AI Employees tools to execute it.",
    actions,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CommandBody;

    const businessId = getBusinessId(body);
    const prompt = cleanString(body.prompt);
    const mode = body.mode === "execute" ? "execute" : "plan";

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Command prompt is required." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, description, industry, audience, slug")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: "Business not found." },
        { status: 404 }
      );
    }

    const actions = detectActions(prompt);
    const result = buildResult(prompt, business.name, actions);

    const { data: commandRun, error: commandError } = await supabaseAdmin
      .from("command_runs")
      .insert({
        business_id: businessId,
        user_prompt: prompt,
        status: mode === "execute" ? "completed" : "planned",
        actions,
        result: {
          ...result,
          business,
          mode,
        },
      })
      .select()
      .single();

    if (commandError) throw commandError;

    await supabaseAdmin.from("analytics_events").insert({
      business_id: businessId,
      event: "command_center_run",
      source: "command_center",
      revenue: 0,
      metadata: {
        mode,
        actionCount: actions.length,
        commandRunId: commandRun.id,
      },
    });

    return NextResponse.json({
      success: true,
      commandRun,
      result,
    });
  } catch (error) {
    console.error("Command center error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to run command."),
      },
      { status: 500 }
    );
  }
}