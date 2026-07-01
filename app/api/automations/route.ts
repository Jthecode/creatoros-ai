import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type AutomationStatus = "active" | "paused" | "draft";
type AutomationType = "sales" | "marketing" | "support" | "operations";

type AutomationPayload = {
  id?: string;
  businessId?: string;
  business_id?: string;
  name?: string;
  title?: string;
  description?: string | null;
  type?: AutomationType | string;
  trigger?: string | null;
  action?: string | null;
  status?: AutomationStatus | string;
  isActive?: boolean;
  is_active?: boolean;
  runs_count?: number;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: AutomationPayload) {
  return cleanString(body.businessId || body.business_id);
}

function getAutomationName(body: AutomationPayload) {
  return cleanString(body.name || body.title);
}

function normalizeStatus(body: AutomationPayload): AutomationStatus {
  if (typeof body.isActive === "boolean") {
    return body.isActive ? "active" : "paused";
  }

  if (typeof body.is_active === "boolean") {
    return body.is_active ? "active" : "paused";
  }

  const status = cleanString(body.status).toLowerCase();

  if (status === "active" || status === "paused" || status === "draft") {
    return status;
  }

  return "active";
}

function normalizeType(value: unknown): AutomationType {
  const type = cleanString(value).toLowerCase();

  if (
    type === "sales" ||
    type === "marketing" ||
    type === "support" ||
    type === "operations"
  ) {
    return type;
  }

  return "sales";
}

function cleanAutomation(row: Record<string, unknown>) {
  return {
    ...row,
    title: row.name ?? row.title,
    isActive: row.status === "active",
    businessId: row.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackAutomationEvent(params: {
  businessId: string;
  event: string;
  automationId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "automations",
      automation_id: params.automationId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Automation analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const id = searchParams.get("id");
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("automations")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (status) query = query.eq("status", status);
    if (type) query = query.eq("type", type);

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,description.ilike.%${search}%,trigger.ilike.%${search}%,action.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      automations: Array.isArray(data) ? data.map(cleanAutomation) : [],
    });
  } catch (error) {
    console.error("GET automations:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load automations."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AutomationPayload;

    const businessId = getBusinessId(body);
    const name = getAutomationName(body);
    const status = normalizeStatus(body);
    const type = normalizeType(body.type);
    const description = cleanString(body.description);
    const trigger = cleanString(body.trigger);
    const action = cleanString(body.action);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Automation name is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("automations")
      .insert({
        business_id: businessId,
        name,
        description: description || null,
        type,
        trigger: trigger || null,
        action: action || null,
        status,
        runs_count: Number(body.runs_count ?? 0),
        metadata: {
          ...(body.metadata ?? {}),
          createdFrom: "automations_api",
          createdAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackAutomationEvent({
      businessId,
      event: "automation_created",
      automationId: data.id,
      metadata: {
        type,
        status,
        trigger,
        action,
      },
    });

    return NextResponse.json(
      {
        success: true,
        automation: cleanAutomation(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST automations:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create automation."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as AutomationPayload;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Automation ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.name !== undefined || body.title !== undefined) {
      const name = getAutomationName(body);

      if (!name) {
        return NextResponse.json(
          { success: false, error: "Automation name cannot be empty." },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.description !== undefined) {
      updates.description = cleanString(body.description) || null;
    }

    if (body.type !== undefined) {
      updates.type = normalizeType(body.type);
    }

    if (body.trigger !== undefined) {
      updates.trigger = cleanString(body.trigger) || null;
    }

    if (body.action !== undefined) {
      updates.action = cleanString(body.action) || null;
    }

    if (
      body.status !== undefined ||
      body.isActive !== undefined ||
      body.is_active !== undefined
    ) {
      updates.status = normalizeStatus(body);
    }

    if (body.runs_count !== undefined) {
      updates.runs_count = Math.max(0, Number(body.runs_count ?? 0));
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No automation updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("automations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackAutomationEvent({
      businessId: String(data.business_id),
      event: "automation_updated",
      automationId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
        status: data.status,
        type: data.type,
      },
    });

    return NextResponse.json({
      success: true,
      automation: cleanAutomation(data),
    });
  } catch (error) {
    console.error("PATCH automations:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update automation."),
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
        { success: false, error: "Automation ID is required." },
        { status: 400 }
      );
    }

    const { data: automation, error: loadError } = await supabaseAdmin
      .from("automations")
      .select("id, business_id, status, type")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin
      .from("automations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (automation?.business_id) {
      await trackAutomationEvent({
        businessId: automation.business_id,
        event: "automation_deleted",
        automationId: id,
        metadata: {
          status: automation.status,
          type: automation.type,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("DELETE automations:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete automation."),
      },
      { status: 500 }
    );
  }
}