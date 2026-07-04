import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type AutomationEventStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled";

type AutomationEventType =
  | "funnel_lead_submitted"
  | "lead_follow_up"
  | "booking_request_follow_up"
  | "customer_thank_you"
  | "internal_notification"
  | "custom";

type CreateAutomationEventBody = {
  businessId?: string;
  business_id?: string;

  funnelId?: string;
  funnel_id?: string;

  funnelPageId?: string;
  funnel_page_id?: string;

  leadFormId?: string;
  lead_form_id?: string;

  funnelSubmissionId?: string;
  funnel_submission_id?: string;

  leadId?: string;
  lead_id?: string;

  eventType?: AutomationEventType;
  event_type?: AutomationEventType;

  status?: AutomationEventStatus;

  recipientEmail?: string;
  recipient_email?: string;

  recipientPhone?: string;
  recipient_phone?: string;

  recipientName?: string;
  recipient_name?: string;

  subject?: string;
  message?: string;

  scheduledFor?: string;
  scheduled_for?: string;

  metadata?: Record<string, unknown>;
};

type UpdateAutomationEventBody = {
  id?: string;

  status?: AutomationEventStatus;

  recipientEmail?: string;
  recipient_email?: string;

  recipientPhone?: string;
  recipient_phone?: string;

  recipientName?: string;
  recipient_name?: string;

  subject?: string;
  message?: string;

  scheduledFor?: string;
  scheduled_for?: string;

  sentAt?: string | null;
  sent_at?: string | null;

  attempts?: number;
  lastError?: string | null;
  last_error?: string | null;

  metadata?: Record<string, unknown>;
};

const allowedStatuses: AutomationEventStatus[] = [
  "pending",
  "processing",
  "sent",
  "failed",
  "cancelled",
];

const allowedEventTypes: AutomationEventType[] = [
  "funnel_lead_submitted",
  "lead_follow_up",
  "booking_request_follow_up",
  "customer_thank_you",
  "internal_notification",
  "custom",
];

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function getBusinessId(body: CreateAutomationEventBody) {
  return cleanString(body.businessId || body.business_id);
}

function getEventType(value: unknown): AutomationEventType {
  const eventType = cleanString(value) as AutomationEventType;

  if (allowedEventTypes.includes(eventType)) {
    return eventType;
  }

  return "custom";
}

function getStatus(value: unknown, fallback: AutomationEventStatus) {
  const status = cleanString(value) as AutomationEventStatus;

  if (allowedStatuses.includes(status)) {
    return status;
  }

  return fallback;
}

function getNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.round(value));
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.round(parsed));
    }
  }

  return fallback;
}

function getMetadata(value: unknown) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function getNullableDate(value: unknown) {
  const date = cleanString(value);

  if (!date) return null;

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

function getScheduledFor(value: unknown) {
  const date = cleanString(value);

  if (!date) return new Date().toISOString();

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

async function verifyBusiness(businessId: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name")
    .eq("id", businessId)
    .single();

  if (error || !data) return null;

  return data as {
    id: string;
    name: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const businessId = cleanString(searchParams.get("businessId"));
    const funnelId = cleanString(searchParams.get("funnelId"));
    const leadId = cleanString(searchParams.get("leadId"));
    const funnelSubmissionId = cleanString(
      searchParams.get("funnelSubmissionId")
    );

    const status = cleanString(searchParams.get("status"));
    const eventType = cleanString(searchParams.get("eventType"));

    const limit = Math.min(
      Math.max(getNumber(searchParams.get("limit"), 50), 1),
      100
    );

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId is required.",
        },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("automation_events")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (funnelId) {
      query = query.eq("funnel_id", funnelId);
    }

    if (leadId) {
      query = query.eq("lead_id", leadId);
    }

    if (funnelSubmissionId) {
      query = query.eq("funnel_submission_id", funnelSubmissionId);
    }

    if (status && allowedStatuses.includes(status as AutomationEventStatus)) {
      query = query.eq("status", status);
    }

    if (
      eventType &&
      allowedEventTypes.includes(eventType as AutomationEventType)
    ) {
      query = query.eq("event_type", eventType);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    const safeEvents = events ?? [];

    const totals = {
      total: safeEvents.length,
      pending: safeEvents.filter((event) => event.status === "pending").length,
      processing: safeEvents.filter((event) => event.status === "processing")
        .length,
      sent: safeEvents.filter((event) => event.status === "sent").length,
      failed: safeEvents.filter((event) => event.status === "failed").length,
      cancelled: safeEvents.filter((event) => event.status === "cancelled")
        .length,
      leadFollowUps: safeEvents.filter(
        (event) => event.event_type === "lead_follow_up"
      ).length,
      internalNotifications: safeEvents.filter(
        (event) => event.event_type === "internal_notification"
      ).length,
    };

    return NextResponse.json({
      success: true,
      events: safeEvents,
      totals,
    });
  } catch (error) {
    console.error("Automation events GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load automation events."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateAutomationEventBody;

    const businessId = getBusinessId(body);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId is required.",
        },
        { status: 400 }
      );
    }

    const business = await verifyBusiness(businessId);

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          error: "Business not found.",
        },
        { status: 404 }
      );
    }

    const eventType = getEventType(body.eventType || body.event_type);
    const status = getStatus(body.status, "pending");

    const recipientEmail = cleanString(
      body.recipientEmail || body.recipient_email
    );

    const recipientPhone = cleanString(
      body.recipientPhone || body.recipient_phone
    );

    const recipientName =
      cleanString(body.recipientName || body.recipient_name) ||
      recipientEmail ||
      recipientPhone ||
      "Recipient";

    const subject =
      cleanString(body.subject) ||
      (eventType === "internal_notification"
        ? `New notification for ${business.name}`
        : `Follow-up from ${business.name}`);

    const message =
      cleanString(body.message) ||
      `This automation event was created for ${business.name}.`;

    const { data: event, error } = await supabaseAdmin
      .from("automation_events")
      .insert({
        business_id: businessId,

        funnel_id: cleanString(body.funnelId || body.funnel_id) || null,
        funnel_page_id:
          cleanString(body.funnelPageId || body.funnel_page_id) || null,
        lead_form_id:
          cleanString(body.leadFormId || body.lead_form_id) || null,
        funnel_submission_id:
          cleanString(
            body.funnelSubmissionId || body.funnel_submission_id
          ) || null,
        lead_id: cleanString(body.leadId || body.lead_id) || null,

        event_type: eventType,
        status,

        recipient_email: recipientEmail || null,
        recipient_phone: recipientPhone || null,
        recipient_name: recipientName,

        subject,
        message,

        scheduled_for: getScheduledFor(body.scheduledFor || body.scheduled_for),

        metadata: {
          ...getMetadata(body.metadata),
          createdVia: "automation_events_api",
          businessName: business.name,
        },
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Automation events POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create automation event."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateAutomationEventBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Automation event id is required.",
        },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updatePayload.status = getStatus(body.status, "pending");
    }

    if (body.recipientEmail !== undefined || body.recipient_email !== undefined) {
      updatePayload.recipient_email =
        cleanString(body.recipientEmail || body.recipient_email) || null;
    }

    if (body.recipientPhone !== undefined || body.recipient_phone !== undefined) {
      updatePayload.recipient_phone =
        cleanString(body.recipientPhone || body.recipient_phone) || null;
    }

    if (body.recipientName !== undefined || body.recipient_name !== undefined) {
      updatePayload.recipient_name =
        cleanString(body.recipientName || body.recipient_name) || null;
    }

    if (body.subject !== undefined) {
      updatePayload.subject = cleanString(body.subject) || null;
    }

    if (body.message !== undefined) {
      updatePayload.message = cleanString(body.message) || null;
    }

    if (body.scheduledFor !== undefined || body.scheduled_for !== undefined) {
      updatePayload.scheduled_for = getScheduledFor(
        body.scheduledFor || body.scheduled_for
      );
    }

    if (body.sentAt !== undefined || body.sent_at !== undefined) {
      updatePayload.sent_at = getNullableDate(body.sentAt ?? body.sent_at);
    }

    if (body.attempts !== undefined) {
      updatePayload.attempts = getNumber(body.attempts, 0);
    }

    if (body.lastError !== undefined || body.last_error !== undefined) {
      updatePayload.last_error =
        cleanString(body.lastError || body.last_error) || null;
    }

    if (body.metadata !== undefined) {
      updatePayload.metadata = getMetadata(body.metadata);
    }

    const { data: event, error } = await supabaseAdmin
      .from("automation_events")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error("Automation events PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update automation event."),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const id = cleanString(searchParams.get("id"));

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Automation event id is required.",
        },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("automation_events")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Automation events DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete automation event."),
      },
      { status: 500 }
    );
  }
}