import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type AIGenerationBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  module?: string;
  prompt?: string | null;
  result?: string;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: AIGenerationBody) {
  return cleanString(body.businessId || body.business_id);
}

function cleanGeneration(row: Record<string, unknown>) {
  return {
    ...row,
    businessId: row.business_id,
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
    const id = searchParams.get("id");
    const generationModule = searchParams.get("module");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("ai_generations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (id) {
      query = query.eq("id", id);
    }

    if (generationModule) {
      query = query.eq("module", generationModule);
    }

    if (q) {
      query = query.or(
        `module.ilike.%${q}%,prompt.ilike.%${q}%,result.ilike.%${q}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      generations: Array.isArray(data) ? data.map(cleanGeneration) : [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load AI generations."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AIGenerationBody;

    const businessId = getBusinessId(body);
    const generationModule = cleanString(body.module) || "general";
    const prompt = cleanString(body.prompt);
    const result = cleanString(body.result);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!result) {
      return NextResponse.json(
        { success: false, error: "AI result is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ai_generations")
      .insert({
        business_id: businessId,
        module: generationModule,
        prompt: prompt || null,
        result,
        metadata: body.metadata ?? {},
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from("analytics_events").insert({
      business_id: businessId,
      event: "ai_generation_saved",
      source: "ai_generations",
      revenue: 0,
      metadata: {
        module: generationModule,
        generationId: data.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        generation: cleanGeneration(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to save AI generation."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as AIGenerationBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "AI generation ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.module !== undefined) {
      updates.module = cleanString(body.module) || "general";
    }

    if (body.prompt !== undefined) {
      const prompt = cleanString(body.prompt);
      updates.prompt = prompt || null;
    }

    if (body.result !== undefined) {
      const result = cleanString(body.result);

      if (!result) {
        return NextResponse.json(
          { success: false, error: "AI result cannot be empty." },
          { status: 400 }
        );
      }

      updates.result = result;
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No AI generation updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ai_generations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      generation: cleanGeneration(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update AI generation."),
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
        { success: false, error: "AI generation ID is required." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("ai_generations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete AI generation."),
      },
      { status: 500 }
    );
  }
}