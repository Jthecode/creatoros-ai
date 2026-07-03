import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type FunnelBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  goal?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: FunnelBody) {
  return cleanString(body.businessId || body.business_id);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeStatus(value: unknown) {
  const status = cleanString(value).toLowerCase();

  if (status === "draft" || status === "published" || status === "archived") {
    return status;
  }

  return "draft";
}

function cleanFunnel(row: Record<string, unknown>) {
  return {
    ...row,
    businessId: row.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackFunnelEvent(params: {
  businessId: string;
  event: string;
  funnelId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "funnels",
      funnel_id: params.funnelId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Funnel analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("funnels")
      .select(
        `
        *,
        funnel_pages (
          id,
          title,
          slug,
          type,
          sort_order,
          status,
          created_at
        )
      `
      )
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (slug) query = query.eq("slug", slug);
    if (status) query = query.eq("status", status);

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,slug.ilike.%${search}%,description.ilike.%${search}%,goal.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      funnels: Array.isArray(data) ? data.map(cleanFunnel) : [],
    });
  } catch (error) {
    console.error("Funnels GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load funnels."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FunnelBody;

    const businessId = getBusinessId(body);
    const name = cleanString(body.name);
    const slug = slugify(cleanString(body.slug) || name);
    const description = cleanString(body.description);
    const goal = cleanString(body.goal);
    const status = normalizeStatus(body.status);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Funnel name is required." },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Funnel slug is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("funnels")
      .insert({
        business_id: businessId,
        name,
        slug,
        description: description || null,
        goal: goal || null,
        status,
        metadata: {
          ...(body.metadata ?? {}),
          createdFrom: "funnels_api",
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackFunnelEvent({
      businessId,
      event: "funnel_created",
      funnelId: data.id,
      metadata: {
        name,
        slug,
        status,
        goal,
      },
    });

    return NextResponse.json(
      {
        success: true,
        funnel: cleanFunnel(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Funnels POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create funnel."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as FunnelBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Funnel ID is required." },
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
          { success: false, error: "Funnel name cannot be empty." },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.slug !== undefined) {
      const slug = slugify(cleanString(body.slug));

      if (!slug) {
        return NextResponse.json(
          { success: false, error: "Funnel slug cannot be empty." },
          { status: 400 }
        );
      }

      updates.slug = slug;
    }

    if (body.description !== undefined) {
      updates.description = cleanString(body.description) || null;
    }

    if (body.goal !== undefined) {
      updates.goal = cleanString(body.goal) || null;
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(body.status);
    }

    if (body.metadata !== undefined) {
      updates.metadata = {
        ...(body.metadata ?? {}),
        updatedAt: new Date().toISOString(),
      };
    }

    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length === 1) {
      return NextResponse.json(
        { success: false, error: "No funnel updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("funnels")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackFunnelEvent({
      businessId: String(data.business_id),
      event: "funnel_updated",
      funnelId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
        status: data.status,
        slug: data.slug,
      },
    });

    return NextResponse.json({
      success: true,
      funnel: cleanFunnel(data),
    });
  } catch (error) {
    console.error("Funnels PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update funnel."),
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
        { success: false, error: "Funnel ID is required." },
        { status: 400 }
      );
    }

    const { data: funnel, error: loadError } = await supabaseAdmin
      .from("funnels")
      .select("id, business_id, slug, status")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin
      .from("funnels")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (funnel?.business_id) {
      await trackFunnelEvent({
        businessId: funnel.business_id,
        event: "funnel_deleted",
        funnelId: id,
        metadata: {
          slug: funnel.slug,
          status: funnel.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Funnels DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete funnel."),
      },
      { status: 500 }
    );
  }
}