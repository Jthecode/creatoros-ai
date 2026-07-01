import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function createSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = body.name?.trim();
    const userId = body.userId;

    if (!name) {
      return NextResponse.json(
        { error: "Business name is required." },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    const slug = createSlug(name);

    const { data, error } = await supabaseAdmin
      .from("businesses")
      .insert({
        owner_id: userId,
        name,
        slug,
        tagline: body.tagline || null,
        description: body.description || null,
        industry: body.industry || null,
        audience: body.audience || null,
        brand_voice: body.brandVoice || null,
        storefront_headline: body.storefrontHeadline || null,
        storefront_subheadline: body.storefrontSubheadline || null,
        generated_data: body.generatedData || null,
        status: "draft",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      business: data,
    });
  } catch (error) {
    console.error("Create business error:", error);

    return NextResponse.json(
      { error: "Unable to create business." },
      { status: 500 }
    );
  }
}