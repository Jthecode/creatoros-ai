import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type FunnelPageBody = {
  id?: string;
  funnelId?: string;
  funnel_id?: string;
  businessId?: string;
  business_id?: string;
  title?: string | null;
  slug?: string | null;
  type?: string | null;
  sort_order?: number | string | null;
  html_content?: string | null;
  content?: Record<string, unknown> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  status?: string | null;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getFunnelId(body: FunnelPageBody) {
  return cleanString(body.funnelId || body.funnel_id);
}

function getBusinessId(body: FunnelPageBody) {
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

function normalizePageType(value: unknown) {
  const type = cleanString(value).toLowerCase();

  if (
    type === "landing" ||
    type === "checkout" ||
    type === "upsell" ||
    type === "thank-you" ||
    type === "downsell" ||
    type === "email-capture"
  ) {
    return type;
  }

  return "landing";
}

function normalizeSortOrder(value: unknown) {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? 0), 10);

  if (!Number.isFinite(parsed)) return 0;

  return Math.max(0, parsed);
}

function cleanPage(row: Record<string, unknown>) {
  return {
    ...row,
    funnelId: row.funnel_id,
    businessId: row.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackFunnelPageEvent(params: {
  businessId: string;
  event: string;
  funnelId?: string;
  pageId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "funnel_pages",
      funnel_id: params.funnelId ?? null,
      funnel_page_id: params.pageId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Funnel page analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const funnelId = searchParams.get("funnelId");
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    if (!businessId && !funnelId && !id) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId, funnelId, or id is required.",
        },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("funnel_pages")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (businessId) query = query.eq("business_id", businessId);
    if (funnelId) query = query.eq("funnel_id", funnelId);
    if (id) query = query.eq("id", id);
    if (slug) query = query.eq("slug", slug);
    if (type) query = query.eq("type", type);
    if (status) query = query.eq("status", status);

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,slug.ilike.%${search}%,type.ilike.%${search}%,seo_title.ilike.%${search}%,seo_description.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      pages: Array.isArray(data) ? data.map(cleanPage) : [],
    });
  } catch (error) {
    console.error("Funnel pages GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load funnel pages."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FunnelPageBody;

    const funnelId = getFunnelId(body);
    let businessId = getBusinessId(body);
    const title = cleanString(body.title);
    const slug = slugify(cleanString(body.slug) || title);
    const type = normalizePageType(body.type);
    const sortOrder = normalizeSortOrder(body.sort_order);
    const status = normalizeStatus(body.status);

    if (!funnelId) {
      return NextResponse.json(
        { success: false, error: "funnelId is required." },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Page title is required." },
        { status: 400 }
      );
    }

    if (!slug) {
      return NextResponse.json(
        { success: false, error: "Page slug is required." },
        { status: 400 }
      );
    }

    if (!businessId) {
      const { data: funnel, error: funnelError } = await supabaseAdmin
        .from("funnels")
        .select("business_id")
        .eq("id", funnelId)
        .single();

      if (funnelError || !funnel) {
        return NextResponse.json(
          { success: false, error: "Funnel not found." },
          { status: 404 }
        );
      }

      businessId = String(funnel.business_id);
    }

    const { data, error } = await supabaseAdmin
      .from("funnel_pages")
      .insert({
        funnel_id: funnelId,
        business_id: businessId,
        title,
        slug,
        type,
        sort_order: sortOrder,
        html_content: cleanString(body.html_content) || null,
        content: body.content ?? {},
        seo_title: cleanString(body.seo_title) || title,
        seo_description: cleanString(body.seo_description) || null,
        status,
        metadata: {
          ...(body.metadata ?? {}),
          createdFrom: "funnel_pages_api",
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackFunnelPageEvent({
      businessId,
      funnelId,
      pageId: data.id,
      event: "funnel_page_created",
      metadata: {
        title,
        slug,
        type,
        status,
        sortOrder,
      },
    });

    return NextResponse.json(
      {
        success: true,
        page: cleanPage(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Funnel pages POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create funnel page."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as FunnelPageBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Funnel page ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.funnelId || body.funnel_id) {
      updates.funnel_id = getFunnelId(body);
    }

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.title !== undefined) {
      const title = cleanString(body.title);

      if (!title) {
        return NextResponse.json(
          { success: false, error: "Page title cannot be empty." },
          { status: 400 }
        );
      }

      updates.title = title;
    }

    if (body.slug !== undefined) {
      const slug = slugify(cleanString(body.slug));

      if (!slug) {
        return NextResponse.json(
          { success: false, error: "Page slug cannot be empty." },
          { status: 400 }
        );
      }

      updates.slug = slug;
    }

    if (body.type !== undefined) {
      updates.type = normalizePageType(body.type);
    }

    if (body.sort_order !== undefined) {
      updates.sort_order = normalizeSortOrder(body.sort_order);
    }

    if (body.html_content !== undefined) {
      updates.html_content = cleanString(body.html_content) || null;
    }

    if (body.content !== undefined) {
      updates.content = body.content ?? {};
    }

    if (body.seo_title !== undefined) {
      updates.seo_title = cleanString(body.seo_title) || null;
    }

    if (body.seo_description !== undefined) {
      updates.seo_description = cleanString(body.seo_description) || null;
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
        { success: false, error: "No funnel page updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("funnel_pages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackFunnelPageEvent({
      businessId: String(data.business_id),
      funnelId: String(data.funnel_id),
      pageId: data.id,
      event: "funnel_page_updated",
      metadata: {
        updatedFields: Object.keys(updates),
        type: data.type,
        status: data.status,
        slug: data.slug,
      },
    });

    return NextResponse.json({
      success: true,
      page: cleanPage(data),
    });
  } catch (error) {
    console.error("Funnel pages PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update funnel page."),
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
        { success: false, error: "Funnel page ID is required." },
        { status: 400 }
      );
    }

    const { data: page, error: loadError } = await supabaseAdmin
      .from("funnel_pages")
      .select("id, business_id, funnel_id, slug, type, status")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin
      .from("funnel_pages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (page?.business_id) {
      await trackFunnelPageEvent({
        businessId: String(page.business_id),
        funnelId: String(page.funnel_id),
        pageId: id,
        event: "funnel_page_deleted",
        metadata: {
          slug: page.slug,
          type: page.type,
          status: page.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Funnel pages DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete funnel page."),
      },
      { status: 500 }
    );
  }
}