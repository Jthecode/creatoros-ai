import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

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

type AutomationEventRow = {
  id: string;
  business_id: string;

  funnel_id: string | null;
  funnel_page_id: string | null;
  lead_form_id: string | null;
  funnel_submission_id: string | null;
  lead_id: string | null;

  event_type: AutomationEventType;
  status: AutomationEventStatus;

  recipient_email: string | null;
  recipient_phone: string | null;
  recipient_name: string | null;

  subject: string | null;
  message: string | null;

  scheduled_for: string;
  sent_at: string | null;

  attempts: number | null;
  last_error: string | null;

  metadata: Record<string, unknown> | null;

  created_at: string;
  updated_at: string;
};

type ProcessResult = {
  id: string;
  status: "sent" | "failed" | "skipped";
  reason?: string;
  resendId?: string | null;
};

const resendApiKey = process.env.RESEND_API_KEY || "";
const automationSecret = process.env.AUTOMATION_SECRET || "";
const fromEmail =
  process.env.AUTOMATION_FROM_EMAIL || "CreatorOS AI <noreply@example.com>";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
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

function getLimit(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get("limit");

  return Math.min(Math.max(getNumber(rawLimit, 10), 1), 50);
}

function getAuthSecret(request: NextRequest) {
  const headerSecret = cleanString(request.headers.get("x-automation-secret"));
  const querySecret = cleanString(request.nextUrl.searchParams.get("secret"));

  return headerSecret || querySecret;
}

function isVercelCronRequest(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const cronHeader = request.headers.get("x-vercel-cron") || "";

  return (
    userAgent.includes("vercel-cron/1.0") ||
    cronHeader === "1" ||
    cronHeader.toLowerCase() === "true"
  );
}

function isAuthorized(request: NextRequest) {
  if (isVercelCronRequest(request)) {
    return true;
  }

  if (!automationSecret) {
    return false;
  }

  return getAuthSecret(request) === automationSecret;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function textToHtml(value: string) {
  return escapeHtml(value)
    .split("\n")
    .map((line) => {
      if (!line.trim()) return "<br />";
      return `<p style="margin:0 0 14px;color:#d4d4d8;font-size:15px;line-height:1.7;">${line}</p>`;
    })
    .join("");
}

function buildEmailHtml(options: {
  subject: string;
  message: string;
  recipientName: string;
}) {
  const { subject, message, recipientName } = options;

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(subject)}</title>
  </head>

  <body style="margin:0;background:#050505;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:640px;border:1px solid rgba(255,255,255,.12);border-radius:24px;background:#0b0b0b;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 18px;">
                <div style="display:inline-block;border:1px solid rgba(250,204,21,.28);background:rgba(250,204,21,.1);color:#fde68a;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">
                  CreatorOS AI
                </div>

                <h1 style="margin:22px 0 8px;color:#ffffff;font-size:30px;line-height:1.1;font-weight:900;">
                  ${escapeHtml(subject)}
                </h1>

                <p style="margin:0;color:#a1a1aa;font-size:14px;line-height:1.6;">
                  ${recipientName ? `Hi ${escapeHtml(recipientName)},` : "Hello,"}
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:0 28px 28px;">
                <div style="border-top:1px solid rgba(255,255,255,.1);padding-top:24px;">
                  ${textToHtml(message)}
                </div>

                <div style="margin-top:28px;border-top:1px solid rgba(255,255,255,.1);padding-top:18px;">
                  <p style="margin:0;color:#71717a;font-size:12px;line-height:1.6;">
                    This message was sent by a CreatorOS AI automation.
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

async function markEventProcessing(event: AutomationEventRow) {
  const nextAttempts = Number(event.attempts ?? 0) + 1;

  const { data, error } = await supabaseAdmin
    .from("automation_events")
    .update({
      status: "processing",
      attempts: nextAttempts,
      last_error: null,
      metadata: {
        ...(event.metadata || {}),
        processingStartedAt: new Date().toISOString(),
      },
    })
    .eq("id", event.id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) throw error;

  return data as AutomationEventRow | null;
}

async function markEventSent(options: {
  event: AutomationEventRow;
  resendId?: string | null;
}) {
  const { event, resendId } = options;

  const { error } = await supabaseAdmin
    .from("automation_events")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
      last_error: null,
      metadata: {
        ...(event.metadata || {}),
        deliveryProvider: "resend",
        resendId: resendId || null,
        processedAt: new Date().toISOString(),
      },
    })
    .eq("id", event.id);

  if (error) throw error;
}

async function markEventFailed(options: {
  event: AutomationEventRow;
  errorMessage: string;
}) {
  const { event, errorMessage } = options;
  const attempts = Number(event.attempts ?? 0);

  const nextStatus = attempts >= 3 ? "failed" : "pending";

  const { error } = await supabaseAdmin
    .from("automation_events")
    .update({
      status: nextStatus,
      attempts,
      last_error: errorMessage,
      metadata: {
        ...(event.metadata || {}),
        lastProcessError: errorMessage,
        lastAttemptAt: new Date().toISOString(),
      },
    })
    .eq("id", event.id);

  if (error) throw error;
}

async function loadPendingEvents(limit: number) {
  const { data, error } = await supabaseAdmin
    .from("automation_events")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);

  if (error) throw error;

  return (data ?? []) as AutomationEventRow[];
}

function shouldSendEmail(event: AutomationEventRow) {
  if (!event.recipient_email) {
    return {
      ok: false,
      reason: "No recipient email.",
    };
  }

  if (!event.subject) {
    return {
      ok: false,
      reason: "No email subject.",
    };
  }

  if (!event.message) {
    return {
      ok: false,
      reason: "No email message.",
    };
  }

  if (event.status !== "processing") {
    return {
      ok: false,
      reason: `Event status is ${event.status}.`,
    };
  }

  return {
    ok: true,
    reason: "",
  };
}

async function processEvent(event: AutomationEventRow): Promise<ProcessResult> {
  const processingEvent = await markEventProcessing(event);

  if (!processingEvent) {
    return {
      id: event.id,
      status: "skipped",
      reason: "Event was already claimed or no longer pending.",
    };
  }

  const sendCheck = shouldSendEmail(processingEvent);

  if (!sendCheck.ok) {
    await markEventFailed({
      event: processingEvent,
      errorMessage: sendCheck.reason,
    });

    return {
      id: event.id,
      status: "failed",
      reason: sendCheck.reason,
    };
  }

  if (!resend) {
    await markEventFailed({
      event: processingEvent,
      errorMessage: "RESEND_API_KEY is not configured.",
    });

    return {
      id: event.id,
      status: "failed",
      reason: "RESEND_API_KEY is not configured.",
    };
  }

  try {
    const subject = processingEvent.subject || "CreatorOS AI Follow-Up";
    const message =
      processingEvent.message || "This is a CreatorOS AI automation message.";
    const recipientName = processingEvent.recipient_name || "";

    const emailResult = await resend.emails.send({
      from: fromEmail,
      to: [processingEvent.recipient_email as string],
      subject,
      text: message,
      html: buildEmailHtml({
        subject,
        message,
        recipientName,
      }),
    });

    if (emailResult.error) {
      throw new Error(emailResult.error.message);
    }

    await markEventSent({
      event: processingEvent,
      resendId: emailResult.data?.id || null,
    });

    return {
      id: event.id,
      status: "sent",
      resendId: emailResult.data?.id || null,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error, "Unable to send email.");

    await markEventFailed({
      event: processingEvent,
      errorMessage,
    });

    return {
      id: event.id,
      status: "failed",
      reason: errorMessage,
    };
  }
}

async function processPendingAutomationEvents(request: NextRequest) {
  const limit = getLimit(request);
  const events = await loadPendingEvents(limit);

  const results: ProcessResult[] = [];

  for (const event of events) {
    const result = await processEvent(event);
    results.push(result);
  }

  return {
    processed: results.length,
    results,
    totals: {
      sent: results.filter((result) => result.status === "sent").length,
      failed: results.filter((result) => result.status === "failed").length,
      skipped: results.filter((result) => result.status === "skipped").length,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized automation processor request.",
        },
        { status: 401 }
      );
    }

    const result = await processPendingAutomationEvents(request);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Automation processor error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to process automation events."),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized automation processor request.",
        },
        { status: 401 }
      );
    }

    const shouldProcess =
      request.nextUrl.searchParams.get("process") === "1" ||
      isVercelCronRequest(request);

    if (shouldProcess) {
      const result = await processPendingAutomationEvents(request);

      return NextResponse.json({
        success: true,
        route: "CreatorOS AI Automation Event Processor",
        mode: isVercelCronRequest(request) ? "vercel_cron" : "manual_get",
        resendConfigured: Boolean(resendApiKey),
        fromEmail,
        ...result,
      });
    }

    const limit = getLimit(request);
    const events = await loadPendingEvents(limit);

    return NextResponse.json({
      success: true,
      route: "CreatorOS AI Automation Event Processor",
      mode: "inspect",
      pendingCount: events.length,
      resendConfigured: Boolean(resendApiKey),
      fromEmail,
      cronAuthorized: isVercelCronRequest(request),
      events: events.map((event) => ({
        id: event.id,
        eventType: event.event_type,
        status: event.status,
        recipientEmail: event.recipient_email,
        subject: event.subject,
        scheduledFor: event.scheduled_for,
        attempts: event.attempts,
      })),
    });
  } catch (error) {
    console.error("Automation processor GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to inspect automation events."),
      },
      { status: 500 }
    );
  }
}