import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type WebsitePageBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  title?: string | null;
  slug?: string | null;
  content?: Record<string, unknown> | null;
  html_content?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  status?: string | null;
  is_homepage?: boolean;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: WebsitePageBody) {
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

  if (status === "published" || status === "draft" || status === "archived") {
    return status;
  }

  return "draft";
}

function cleanPage(row: Record<string, unknown>) {
  return {
    ...row,
    businessId: row.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackWebsiteEvent(params: {
  businessId: string;
  event: string;
  pageId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "website_pages",
      website_page_id: params.pageId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Website analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const status = searchParams.get("status");
    const homepage = searchParams.get("homepage");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("website_pages")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (slug) query = query.eq("slug", slug);
    if (status) query = query.eq("status", status);
    if (homepage === "true") query = query.eq("is_homepage", true);

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `title.ilike.%${search}%,slug.ilike.%${search}%,seo_title.ilike.%${search}%,seo_description.ilike.%${search}%`
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
    console.error("Website pages GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load website pages."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as WebsitePageBody;

    const businessId = getBusinessId(body);
    const title = cleanString(body.title);
    const slug = slugify(cleanString(body.slug) || title);
    const status = normalizeStatus(body.status);
    const isHomepage = Boolean(body.is_homepage);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
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

    if (isHomepage) {
      await supabaseAdmin
        .from("website_pages")
        .update({ is_homepage: false })
        .eq("business_id", businessId);
    }

    const { data, error } = await supabaseAdmin
      .from("website_pages")
      .insert({
        business_id: businessId,
        title,
        slug,
        content: body.content ?? {},
        html_content: cleanString(body.html_content) || null,
        seo_title: cleanString(body.seo_title) || title,
        seo_description: cleanString(body.seo_description) || null,
        status,
        is_homepage: isHomepage,
        metadata: {
          ...(body.metadata ?? {}),
          createdFrom: "website_pages_api",
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackWebsiteEvent({
      businessId,
      event: "website_page_created",
      pageId: data.id,
      metadata: {
        title,
        slug,
        status,
        isHomepage,
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
    console.error("Website pages POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create website page."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as WebsitePageBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Website page ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

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

    if (body.content !== undefined) {
      updates.content = body.content ?? {};
    }

    if (body.html_content !== undefined) {
      updates.html_content = cleanString(body.html_content) || null;
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

    if (body.is_homepage !== undefined) {
      updates.is_homepage = Boolean(body.is_homepage);
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
        { success: false, error: "No website page updates provided." },
        { status: 400 }
      );
    }

    if (updates.is_homepage === true) {
      const { data: existingPage, error: existingError } = await supabaseAdmin
        .from("website_pages")
        .select("business_id")
        .eq("id", id)
        .single();

      if (existingError) throw existingError;

      await supabaseAdmin
        .from("website_pages")
        .update({ is_homepage: false })
        .eq("business_id", existingPage.business_id);
    }

    const { data, error } = await supabaseAdmin
      .from("website_pages")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackWebsiteEvent({
      businessId: String(data.business_id),
      event: "website_page_updated",
      pageId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
        status: data.status,
        slug: data.slug,
      },
    });

    return NextResponse.json({
      success: true,
      page: cleanPage(data),
    });
  } catch (error) {
    console.error("Website pages PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update website page."),
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
        { success: false, error: "Website page ID is required." },
        { status: 400 }
      );
    }

    const { data: page, error: loadError } = await supabaseAdmin
      .from("website_pages")
      .select("id, business_id, slug, status")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin
      .from("website_pages")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (page?.business_id) {
      await trackWebsiteEvent({
        businessId: page.business_id,
        event: "website_page_deleted",
        pageId: id,
        metadata: {
          slug: page.slug,
          status: page.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Website pages DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete website page."),
      },
      { status: 500 }
    );
  }
}