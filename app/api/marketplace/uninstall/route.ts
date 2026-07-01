import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type UninstallBody = {
  id?: string;
  installedAppId?: string;
  installed_app_id?: string;
  businessId?: string;
  business_id?: string;
  marketplaceAppId?: string;
  marketplace_app_id?: string;
  appId?: string;
  hardDelete?: boolean;
  hard_delete?: boolean;
  removeProvisionedResources?: boolean;
  remove_provisioned_resources?: boolean;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getInstalledAppId(body: UninstallBody) {
  return cleanString(body.id || body.installedAppId || body.installed_app_id);
}

function getBusinessId(body: UninstallBody) {
  return cleanString(body.businessId || body.business_id);
}

function getMarketplaceAppId(body: UninstallBody) {
  return cleanString(
    body.marketplaceAppId || body.marketplace_app_id || body.appId
  );
}

function cleanInstalledApp(app: Record<string, unknown>) {
  return {
    ...app,
    businessId: app.business_id,
    marketplaceAppId: app.marketplace_app_id,
  };
}

function getBoolean(value: unknown) {
  return value === true || value === "true";
}

async function findInstalledApp(body: UninstallBody) {
  const installedAppId = getInstalledAppId(body);
  const businessId = getBusinessId(body);
  const marketplaceAppId = getMarketplaceAppId(body);

  if (installedAppId) {
    const { data, error } = await supabaseAdmin
      .from("installed_apps")
      .select("*")
      .eq("id", installedAppId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  if (businessId && marketplaceAppId) {
    const { data, error } = await supabaseAdmin
      .from("installed_apps")
      .select("*")
      .eq("business_id", businessId)
      .eq("marketplace_app_id", marketplaceAppId)
      .maybeSingle();

    if (error) throw error;

    return data;
  }

  return null;
}

async function removeProvisionedResources(params: {
  businessId: string;
  title: string;
  marketplaceAppId: string;
}) {
  const { businessId, title, marketplaceAppId } = params;

  const removed: {
    agents: number;
    automations: number;
  } = {
    agents: 0,
    automations: 0,
  };

  const { data: agents, error: agentsError } = await supabaseAdmin
    .from("ai_agents")
    .select("id")
    .eq("business_id", businessId)
    .or(
      `name.eq.${title},metadata->>sourceApp.eq.${title},metadata->>marketplaceAppId.eq.${marketplaceAppId}`
    );

  if (!agentsError && Array.isArray(agents) && agents.length > 0) {
    const ids = agents.map((agent) => agent.id);

    const { error } = await supabaseAdmin
      .from("ai_agents")
      .delete()
      .in("id", ids);

    if (!error) {
      removed.agents = ids.length;
    }
  }

  const { data: automations, error: automationsError } = await supabaseAdmin
    .from("automations")
    .select("id")
    .eq("business_id", businessId)
    .or(
      `name.eq.${title},metadata->>sourceApp.eq.${title},metadata->>marketplaceAppId.eq.${marketplaceAppId}`
    );

  if (
    !automationsError &&
    Array.isArray(automations) &&
    automations.length > 0
  ) {
    const ids = automations.map((automation) => automation.id);

    const { error } = await supabaseAdmin
      .from("automations")
      .delete()
      .in("id", ids);

    if (!error) {
      removed.automations = ids.length;
    }
  }

  return removed;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UninstallBody;

    const hardDelete = getBoolean(body.hardDelete ?? body.hard_delete);
    const shouldRemoveResources = getBoolean(
      body.removeProvisionedResources ?? body.remove_provisioned_resources
    );

    const installedApp = await findInstalledApp(body);

    if (!installedApp) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Installed app not found. Provide id or businessId + marketplaceAppId.",
        },
        {
          status: 404,
        }
      );
    }

    const businessId = cleanString(installedApp.business_id);
    const marketplaceAppId = cleanString(installedApp.marketplace_app_id);
    const title = cleanString(installedApp.title) || "Marketplace App";

    let removedResources = {
      agents: 0,
      automations: 0,
    };

    if (shouldRemoveResources) {
      removedResources = await removeProvisionedResources({
        businessId,
        title,
        marketplaceAppId,
      });
    }

    if (hardDelete) {
      const { error } = await supabaseAdmin
        .from("installed_apps")
        .delete()
        .eq("id", installedApp.id);

      if (error) throw error;

      await supabaseAdmin.from("analytics_events").insert({
        business_id: businessId,
        event: "marketplace_uninstall",
        source: "marketplace",
        revenue: 0,
        metadata: {
          installedAppId: installedApp.id,
          marketplaceAppId,
          title,
          hardDelete: true,
          removedResources,
        },
      });

      return NextResponse.json({
        success: true,
        deletedId: installedApp.id,
        hardDeleted: true,
        removedResources,
      });
    }

    const previousMetadata =
      typeof installedApp.metadata === "object" && installedApp.metadata !== null
        ? installedApp.metadata
        : {};

    const { data, error } = await supabaseAdmin
      .from("installed_apps")
      .update({
        status: "removed",
        metadata: {
          ...previousMetadata,
          removedAt: new Date().toISOString(),
          removedBy: "marketplace_uninstall",
          removedResources,
        },
      })
      .eq("id", installedApp.id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("analytics_events").insert({
      business_id: businessId,
      event: "marketplace_uninstall",
      source: "marketplace",
      revenue: 0,
      metadata: {
        installedAppId: installedApp.id,
        marketplaceAppId,
        title,
        hardDelete: false,
        removedResources,
      },
    });

    return NextResponse.json({
      success: true,
      app: cleanInstalledApp(data),
      hardDeleted: false,
      removedResources,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to uninstall marketplace app.",
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

    const body: UninstallBody = {
      id: searchParams.get("id") ?? undefined,
      businessId: searchParams.get("businessId") ?? undefined,
      marketplaceAppId: searchParams.get("marketplaceAppId") ?? undefined,
      hardDelete: searchParams.get("hardDelete") === "true",
      removeProvisionedResources:
        searchParams.get("removeProvisionedResources") === "true",
    };

    const installedApp = await findInstalledApp(body);

    if (!installedApp) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Installed app not found. Provide id or businessId + marketplaceAppId.",
        },
        {
          status: 404,
        }
      );
    }

    const businessId = cleanString(installedApp.business_id);
    const marketplaceAppId = cleanString(installedApp.marketplace_app_id);
    const title = cleanString(installedApp.title) || "Marketplace App";
    const hardDelete = getBoolean(body.hardDelete);
    const shouldRemoveResources = getBoolean(body.removeProvisionedResources);

    let removedResources = {
      agents: 0,
      automations: 0,
    };

    if (shouldRemoveResources) {
      removedResources = await removeProvisionedResources({
        businessId,
        title,
        marketplaceAppId,
      });
    }

    if (hardDelete) {
      const { error } = await supabaseAdmin
        .from("installed_apps")
        .delete()
        .eq("id", installedApp.id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        deletedId: installedApp.id,
        hardDeleted: true,
        removedResources,
      });
    }

    const previousMetadata =
      typeof installedApp.metadata === "object" && installedApp.metadata !== null
        ? installedApp.metadata
        : {};

    const { data, error } = await supabaseAdmin
      .from("installed_apps")
      .update({
        status: "removed",
        metadata: {
          ...previousMetadata,
          removedAt: new Date().toISOString(),
          removedBy: "marketplace_uninstall",
          removedResources,
        },
      })
      .eq("id", installedApp.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      app: cleanInstalledApp(data),
      hardDeleted: false,
      removedResources,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to uninstall marketplace app.",
      },
      {
        status: 500,
      }
    );
  }
}