import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type AutomationPayload = {
  businessId: string;
  title: string;
  trigger?: string;
  action?: string;
  isActive?: boolean;
};

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        {
          error: "businessId is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("automations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      automations: data ?? [],
    });
  } catch (error) {
    console.error("GET automations:", error);

    return NextResponse.json(
      {
        error: "Unable to load automations.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AutomationPayload;

    if (!body.businessId) {
      return NextResponse.json(
        {
          error: "businessId is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.title?.trim()) {
      return NextResponse.json(
        {
          error: "Automation title is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("automations")
      .insert({
        business_id: body.businessId,
        title: body.title,
        trigger: body.trigger ?? "",
        action: body.action ?? "",
        is_active: body.isActive ?? true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      automation: data,
    });
  } catch (error) {
    console.error("POST automations:", error);

    return NextResponse.json(
      {
        error: "Unable to create automation.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();

    const automationId = body.id as string | undefined;

    if (!automationId) {
      return NextResponse.json(
        {
          error: "Automation id is required.",
        },
        {
          status: 400,
        }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.trigger !== undefined) updates.trigger = body.trigger;
    if (body.action !== undefined) updates.action = body.action;
    if (body.isActive !== undefined)
      updates.is_active = body.isActive;

    const { data, error } = await supabaseAdmin
      .from("automations")
      .update(updates)
      .eq("id", automationId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      automation: data,
    });
  } catch (error) {
    console.error("PATCH automations:", error);

    return NextResponse.json(
      {
        error: "Unable to update automation.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const automationId =
      request.nextUrl.searchParams.get("id");

    if (!automationId) {
      return NextResponse.json(
        {
          error: "Automation id is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabaseAdmin
      .from("automations")
      .delete()
      .eq("id", automationId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DELETE automations:", error);

    return NextResponse.json(
      {
        error: "Unable to delete automation.",
      },
      {
        status: 500,
      }
    );
  }
}