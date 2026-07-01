import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type SaveGenerationPayload = {
  businessId: string;
  module: string;
  prompt?: string;
  response: unknown;
};

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId");
    const moduleName = request.nextUrl.searchParams.get("module");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("ai_generations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (moduleName) {
      query = query.eq("module", moduleName);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      generations: data ?? [],
    });
  } catch (error) {
    console.error("GET AI generations:", error);

    return NextResponse.json(
      { error: "Unable to load AI generations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SaveGenerationPayload;

    if (!body.businessId) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!body.module?.trim()) {
      return NextResponse.json(
        { error: "module is required." },
        { status: 400 }
      );
    }

    if (body.response === undefined || body.response === null) {
      return NextResponse.json(
        { error: "response is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ai_generations")
      .insert({
        business_id: body.businessId,
        module: body.module.trim(),
        prompt: body.prompt?.trim() || null,
        response: body.response,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      generation: data,
    });
  } catch (error) {
    console.error("POST AI generation:", error);

    return NextResponse.json(
      { error: "Unable to save AI generation." },
      { status: 500 }
    );
  }
}