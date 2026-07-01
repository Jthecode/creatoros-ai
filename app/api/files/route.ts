import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

type LeadBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status?: LeadStatus | string;
  value?: number | string | null;
  notes?: string | null;
  metadata?: Record<string, unknown> | null;
};

function normalizeString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: LeadBody) {
  return normalizeString(body.businessId || body.business_id);
}

function normalizeStatus(value: unknown): LeadStatus {
  const status = normalizeString(value).toLowerCase();

  if (
    status === "new" ||
    status === "contacted" ||
    status === "qualified" ||
    status === "proposal" ||
    status === "won" ||
    status === "lost"
  ) {
    return status;
  }

  return "new";
}

function normalizeValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parsed = Number.parseFloat(cleaned);

    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}

function cleanSearchQuery(value: string) {
  return value.replace(/[%_,]/g, "").trim();
}

function cleanLead(lead: Record<string, unknown>) {
  return {
    ...lead,
    businessId: lead.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackLeadEvent(params: {
  businessId: string;
  event: string;
  leadId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "leads",
      lead_id: params.leadId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Lead analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const leadId = searchParams.get("id");
    const status = searchParams.get("status");
    const source = searchParams.get("source");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("leads")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (leadId) query = query.eq("id", leadId);
    if (status) query = query.eq("status", status);
    if (source) query = query.eq("source", source);

    if (q) {
      const search = cleanSearchQuery(q);

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      leads: Array.isArray(data) ? data.map(cleanLead) : [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load leads."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LeadBody;

    const businessId = getBusinessId(body);
    const name = normalizeString(body.name);
    const email = normalizeString(body.email);
    const phone = normalizeString(body.phone);
    const company = normalizeString(body.company);
    const source = normalizeString(body.source) || "manual";
    const status = normalizeStatus(body.status);
    const notes = normalizeString(body.notes);
    const value = normalizeValue(body.value);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!name && !email && !phone) {
      return NextResponse.json(
        { success: false, error: "Lead name, email, or phone is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        business_id: businessId,
        name: name || "New Lead",
        email: email || null,
        phone: phone || null,
        company: company || null,
        source,
        status,
        value,
        notes: notes || null,
        metadata: {
          ...(body.metadata ?? {}),
          createdFrom: source,
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackLeadEvent({
      businessId,
      event: "lead_created",
      leadId: data.id,
      metadata: {
        source,
        status,
        value,
        hasEmail: Boolean(email),
        hasPhone: Boolean(phone),
      },
    });

    return NextResponse.json(
      {
        success: true,
        lead: cleanLead(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create lead."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as LeadBody;

    const id = normalizeString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Lead ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.name !== undefined) {
      const name = normalizeString(body.name);

      if (!name) {
        return NextResponse.json(
          { success: false, error: "Lead name cannot be empty." },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.email !== undefined) {
      const email = normalizeString(body.email);
      updates.email = email || null;
    }

    if (body.phone !== undefined) {
      const phone = normalizeString(body.phone);
      updates.phone = phone || null;
    }

    if (body.company !== undefined) {
      const company = normalizeString(body.company);
      updates.company = company || null;
    }

    if (body.source !== undefined) {
      const source = normalizeString(body.source);
      updates.source = source || "manual";
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(body.status);
    }

    if (body.value !== undefined) {
      updates.value = normalizeValue(body.value);
    }

    if (body.notes !== undefined) {
      const notes = normalizeString(body.notes);
      updates.notes = notes || null;
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No lead updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackLeadEvent({
      businessId: normalizeString(data.business_id),
      event: "lead_updated",
      leadId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      lead: cleanLead(data),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update lead."),
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
        { success: false, error: "Lead ID is required." },
        { status: 400 }
      );
    }

    const { data: lead, error: loadError } = await supabaseAdmin
      .from("leads")
      .select("id, business_id, status, source")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin.from("leads").delete().eq("id", id);

    if (error) throw error;

    if (lead?.business_id) {
      await trackLeadEvent({
        businessId: lead.business_id,
        event: "lead_deleted",
        leadId: id,
        metadata: {
          status: lead.status,
          source: lead.source,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete lead."),
      },
      { status: 500 }
    );
  }
}