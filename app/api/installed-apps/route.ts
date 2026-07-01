import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type InstalledAppStatus = "active" | "paused" | "removed";

type InstalledAppBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  marketplace_app_id?: string;
  app_id?: string;
  title?: string;
  name?: string;
  description?: string | null;
  category?: string;
  icon?: string | null;
  status?: InstalledAppStatus | string;
  settings?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: InstalledAppBody) {
  return normalizeString(body.businessId || body.business_id);
}

function normalizeStatus(value: unknown): InstalledAppStatus {
  const status = normalizeString(value).toLowerCase();

  if (status === "active" || status === "paused" || status === "removed") {
    return status;
  }

  return "active";
}

function cleanInstalledApp(app: Record<string, unknown>) {
  return {
    ...app,
    businessId: app.business_id,
    marketplaceAppId: app.marketplace_app_id,
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
    const appId = searchParams.get("id");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

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
      .from("installed_apps")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (appId) {
      query = query.eq("id", appId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) throw error;

    const apps = Array.isArray(data)
      ? data.map((app) => cleanInstalledApp(app))
      : [];

    return NextResponse.json({
      success: true,
      apps,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load installed apps."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as InstalledAppBody;

    const businessId = getBusinessId(body);
    const marketplaceAppId = normalizeString(
      body.marketplace_app_id || body.app_id
    );

    const title =
      normalizeString(body.title) ||
      normalizeString(body.name) ||
      "Installed App";

    const description = normalizeString(body.description);
    const category = normalizeString(body.category) || "ai-modules";
    const status = normalizeStatus(body.status);

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

    if (!marketplaceAppId) {
      return NextResponse.json(
        {
          success: false,
          error: "marketplace_app_id is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data: existingApp, error: existingError } = await supabaseAdmin
      .from("installed_apps")
      .select("*")
      .eq("business_id", businessId)
      .eq("marketplace_app_id", marketplaceAppId)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingApp) {
      const { data, error } = await supabaseAdmin
        .from("installed_apps")
        .update({
          status: "active",
          title,
          description: description || existingApp.description || null,
          category,
          icon: body.icon ?? existingApp.icon ?? null,
          settings: body.settings ?? existingApp.settings ?? {},
          metadata: body.metadata ?? existingApp.metadata ?? {},
        })
        .eq("id", existingApp.id)
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json({
        success: true,
        app: cleanInstalledApp(data),
        alreadyInstalled: true,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("installed_apps")
      .insert({
        business_id: businessId,
        marketplace_app_id: marketplaceAppId,
        title,
        description: description || null,
        category,
        icon: body.icon ?? null,
        status,
        settings: body.settings ?? {},
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        success: true,
        app: cleanInstalledApp(data),
        alreadyInstalled: false,
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
        error: getErrorMessage(error, "Unable to install app."),
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as InstalledAppBody;

    const id = normalizeString(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Installed app ID is required.",
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

    if (body.marketplace_app_id !== undefined || body.app_id !== undefined) {
      const marketplaceAppId = normalizeString(
        body.marketplace_app_id || body.app_id
      );

      if (!marketplaceAppId) {
        return NextResponse.json(
          {
            success: false,
            error: "marketplace_app_id cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      updates.marketplace_app_id = marketplaceAppId;
    }

    if (body.title !== undefined || body.name !== undefined) {
      const title = normalizeString(body.title || body.name);

      if (!title) {
        return NextResponse.json(
          {
            success: false,
            error: "App title cannot be empty.",
          },
          {
            status: 400,
          }
        );
      }

      updates.title = title;
    }

    if (body.description !== undefined) {
      const description = normalizeString(body.description);
      updates.description = description || null;
    }

    if (body.category !== undefined) {
      const category = normalizeString(body.category);
      updates.category = category || "ai-modules";
    }

    if (body.icon !== undefined) {
      updates.icon = body.icon;
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(body.status);
    }

    if (body.settings !== undefined) {
      updates.settings = body.settings ?? {};
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No installed app updates provided.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("installed_apps")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      app: cleanInstalledApp(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update installed app."),
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
    const hardDelete = searchParams.get("hardDelete") === "true";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Installed app ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (hardDelete) {
      const { error } = await supabaseAdmin
        .from("installed_apps")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        deletedId: id,
        hardDeleted: true,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("installed_apps")
      .update({
        status: "removed",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      app: cleanInstalledApp(data),
      hardDeleted: false,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to remove installed app."),
      },
      {
        status: 500,
      }
    );
  }
}