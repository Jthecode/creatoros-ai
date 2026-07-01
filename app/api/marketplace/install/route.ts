import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type MarketplaceCategory =
  | "ai-modules"
  | "templates"
  | "automations"
  | "storefronts"
  | "marketing"
  | "sales"
  | "operations";

type InstallBody = {
  businessId?: string;
  business_id?: string;
  marketplaceAppId?: string;
  marketplace_app_id?: string;
  appId?: string;
  title?: string;
  name?: string;
  description?: string | null;
  category?: MarketplaceCategory | string;
  icon?: string | null;
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: InstallBody) {
  return cleanString(body.businessId || body.business_id);
}

function getMarketplaceAppId(body: InstallBody) {
  return cleanString(
    body.marketplaceAppId || body.marketplace_app_id || body.appId
  );
}

function normalizeCategory(value: unknown): MarketplaceCategory {
  const category = cleanString(value).toLowerCase();

  if (
    category === "ai-modules" ||
    category === "templates" ||
    category === "automations" ||
    category === "storefronts" ||
    category === "marketing" ||
    category === "sales" ||
    category === "operations"
  ) {
    return category;
  }

  return "ai-modules";
}

function getDefaultSettings(category: MarketplaceCategory) {
  if (category === "ai-modules") {
    return {
      enabled: true,
      autoCreateAgent: true,
      showOnStorefront: true,
    };
  }

  if (category === "automations") {
    return {
      enabled: true,
      autoCreateAutomation: true,
      runMode: "manual",
    };
  }

  if (category === "storefronts") {
    return {
      enabled: true,
      showProducts: true,
      showLeadForm: true,
      showAIChat: true,
    };
  }

  return {
    enabled: true,
  };
}

async function createProvisionedAgent(params: {
  businessId: string;
  title: string;
  category: MarketplaceCategory;
}) {
  if (params.category !== "ai-modules" && params.category !== "sales") {
    return null;
  }

  const role =
    params.category === "sales" ? "AI Sales Manager" : "AI Business Assistant";

  const { data, error } = await supabaseAdmin
    .from("ai_agents")
    .insert({
      business_id: params.businessId,
      name: params.title,
      role,
      tone: "professional",
      opening_message:
        "Hi! I’m your AI assistant. I can help customers, answer questions, and support this business.",
      instructions:
        "Help this business answer customer questions, recommend offers, capture leads, and guide people toward the next step.",
      knowledge: null,
      avatar_url: null,
      is_active: true,
      metadata: {
        provisionedBy: "marketplace_install",
        sourceApp: params.title,
      },
    })
    .select()
    .single();

  if (error) {
    console.error("Agent provisioning failed:", error);
    return null;
  }

  return data;
}

async function createProvisionedAutomation(params: {
  businessId: string;
  title: string;
  category: MarketplaceCategory;
}) {
  if (params.category !== "automations" && params.category !== "marketing") {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("automations")
    .insert({
      business_id: params.businessId,
      name: params.title,
      type: params.category === "marketing" ? "marketing" : "operations",
      status: "active",
      description: `Installed from CreatorOS Marketplace: ${params.title}`,
      trigger:
        params.category === "marketing"
          ? "Manual campaign request"
          : "Manual workflow trigger",
      action:
        params.category === "marketing"
          ? "Generate marketing action"
          : "Run business workflow",
      metadata: {
        provisionedBy: "marketplace_install",
        sourceApp: params.title,
      },
    })
    .select()
    .single();

  if (error) {
    console.error("Automation provisioning failed:", error);
    return null;
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InstallBody;

    const businessId = getBusinessId(body);
    const marketplaceAppId = getMarketplaceAppId(body);
    const title =
      cleanString(body.title) || cleanString(body.name) || "Marketplace App";
    const description = cleanString(body.description);
    const category = normalizeCategory(body.category);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!marketplaceAppId) {
      return NextResponse.json(
        { success: false, error: "marketplaceAppId is required." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .maybeSingle();

    if (businessError) throw businessError;

    if (!business) {
      return NextResponse.json(
        { success: false, error: "Business not found." },
        { status: 404 }
      );
    }

    const defaultSettings = getDefaultSettings(category);

    const settings = {
      ...defaultSettings,
      ...(body.settings ?? {}),
    };

    const metadata = {
      ...(body.metadata ?? {}),
      installedFrom: "marketplace",
      installedAt: new Date().toISOString(),
    };

    const { data: existingApp, error: existingError } = await supabaseAdmin
      .from("installed_apps")
      .select("*")
      .eq("business_id", businessId)
      .eq("marketplace_app_id", marketplaceAppId)
      .maybeSingle();

    if (existingError) throw existingError;

    let installedApp;
    let alreadyInstalled = false;

    if (existingApp) {
      alreadyInstalled = true;

      const { data, error } = await supabaseAdmin
        .from("installed_apps")
        .update({
          title,
          description: description || existingApp.description || null,
          category,
          icon: body.icon ?? existingApp.icon ?? null,
          status: "active",
          settings,
          metadata: {
            ...(typeof existingApp.metadata === "object" &&
            existingApp.metadata !== null
              ? existingApp.metadata
              : {}),
            ...metadata,
            reactivatedAt: new Date().toISOString(),
          },
        })
        .eq("id", existingApp.id)
        .select()
        .single();

      if (error) throw error;

      installedApp = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from("installed_apps")
        .insert({
          business_id: businessId,
          marketplace_app_id: marketplaceAppId,
          title,
          description: description || null,
          category,
          icon: body.icon ?? null,
          status: "active",
          settings,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;

      installedApp = data;
    }

    const provisionedAgent =
      settings.autoCreateAgent === true
        ? await createProvisionedAgent({
            businessId,
            title,
            category,
          })
        : null;

    const provisionedAutomation =
      settings.autoCreateAutomation === true
        ? await createProvisionedAutomation({
            businessId,
            title,
            category,
          })
        : null;

    await supabaseAdmin.from("analytics_events").insert({
      business_id: businessId,
      event: "marketplace_install",
      source: "marketplace",
      revenue: 0,
      metadata: {
        marketplaceAppId,
        title,
        category,
        alreadyInstalled,
        installedAppId: installedApp.id,
        provisionedAgentId: provisionedAgent?.id ?? null,
        provisionedAutomationId: provisionedAutomation?.id ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        alreadyInstalled,
        app: {
          ...installedApp,
          businessId: installedApp.business_id,
          marketplaceAppId: installedApp.marketplace_app_id,
        },
        provisioned: {
          agent: provisionedAgent,
          automation: provisionedAutomation,
        },
      },
      {
        status: alreadyInstalled ? 200 : 201,
      }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to install marketplace app.",
      },
      { status: 500 }
    );
  }
}