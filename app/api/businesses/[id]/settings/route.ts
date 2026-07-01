import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      business: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load business settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const updates = {
      name: cleanString(body.name),

      slug: body.slug
        ? slugify(String(body.slug))
        : cleanString(body.name)
          ? slugify(String(body.name))
          : null,

      tagline: cleanString(body.tagline),

      description: cleanString(body.description),

      industry: cleanString(body.industry),

      audience: cleanString(body.audience),

      storefront_headline: cleanString(
        body.storefront_headline
      ),

      storefront_subheadline: cleanString(
        body.storefront_subheadline
      ),

      status:
        cleanString(body.status) ??
        "draft",

      brand_primary_color:
        cleanString(body.brand_primary_color),

      brand_accent_color:
        cleanString(body.brand_accent_color),

      ai_default_tone:
        cleanString(body.ai_default_tone),

      updated_at: new Date().toISOString(),
    };

    if (!updates.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Business name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("businesses")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin
      .from("analytics_events")
      .insert({
        business_id: id,
        event: "business_settings_updated",
        source: "dashboard",
        revenue: 0,
        metadata: {
          updatedFields: Object.keys(body),
          updatedAt: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      business: data,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to save business settings.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const { error } = await supabaseAdmin
      .from("businesses")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "Unable to delete business.",
      },
      {
        status: 500,
      }
    );
  }
}