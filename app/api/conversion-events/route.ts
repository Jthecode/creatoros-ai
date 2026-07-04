import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ConversionEventBody = {
  businessId?: string;
  business_id?: string;
  businessSlug?: string;
  business_slug?: string;

  funnelId?: string;
  funnel_id?: string;
  funnelSlug?: string;
  funnel_slug?: string;

  funnelPageId?: string;
  funnel_page_id?: string;
  pageSlug?: string;
  page_slug?: string;

  leadFormId?: string;
  lead_form_id?: string;
  formSlug?: string;
  form_slug?: string;

  funnelSubmissionId?: string;
  funnel_submission_id?: string;

  leadId?: string;
  lead_id?: string;

  orderId?: string;
  order_id?: string;

  eventName?: string;
  event_name?: string;

  eventType?: ConversionEventType;
  event_type?: ConversionEventType;

  valueCents?: number;
  value_cents?: number;
  currency?: string;

  source?: string;
  pageUrl?: string;
  page_url?: string;
  referrer?: string;

  sessionId?: string;
  session_id?: string;
  visitorId?: string;
  visitor_id?: string;

  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;

  metadata?: Record<string, unknown>;
};

type ConversionEventType =
  | "page_view"
  | "cta_click"
  | "form_view"
  | "form_submit"
  | "lead_created"
  | "booking_request"
  | "checkout_click"
  | "purchase"
  | "custom";

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
};

type FunnelRow = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  status: string | null;
  is_published: boolean | null;
};

type FunnelPageRow = {
  id: string;
  business_id: string;
  funnel_id: string;
  title: string;
  slug: string;
  page_type: string | null;
  is_published: boolean | null;
};

type LeadFormRow = {
  id: string;
  business_id: string;
  funnel_id: string | null;
  funnel_page_id: string | null;
  name: string;
  slug: string;
  status: string | null;
  is_active: boolean | null;
  is_published: boolean | null;
};

const allowedEventTypes: ConversionEventType[] = [
  "page_view",
  "cta_click",
  "form_view",
  "form_submit",
  "lead_created",
  "booking_request",
  "checkout_click",
  "purchase",
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

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || null;
  }

  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    null
  );
}

function getUserAgent(request: NextRequest) {
  return request.headers.get("user-agent") || null;
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

function normalizeCurrency(value: unknown) {
  const currency = cleanString(value).toUpperCase();

  if (!currency) return "USD";

  return currency.slice(0, 8);
}

function getBusinessIdentifiers(body: ConversionEventBody) {
  return {
    businessId: cleanString(body.businessId || body.business_id),
    businessSlug: cleanString(body.businessSlug || body.business_slug),
  };
}

function getFunnelIdentifiers(body: ConversionEventBody) {
  return {
    funnelId: cleanString(body.funnelId || body.funnel_id),
    funnelSlug: cleanString(body.funnelSlug || body.funnel_slug),
  };
}

function getPageIdentifiers(body: ConversionEventBody) {
  return {
    funnelPageId: cleanString(body.funnelPageId || body.funnel_page_id),
    pageSlug: cleanString(body.pageSlug || body.page_slug),
  };
}

function getFormIdentifiers(body: ConversionEventBody) {
  return {
    leadFormId: cleanString(body.leadFormId || body.lead_form_id),
    formSlug: cleanString(body.formSlug || body.form_slug),
  };
}

function getUtmData(body: ConversionEventBody) {
  return {
    utm_source: cleanString(body.utm_source) || null,
    utm_medium: cleanString(body.utm_medium) || null,
    utm_campaign: cleanString(body.utm_campaign) || null,
    utm_term: cleanString(body.utm_term) || null,
    utm_content: cleanString(body.utm_content) || null,
  };
}

function normalizeEventType(value: unknown): ConversionEventType {
  const eventType = cleanString(value) as ConversionEventType;

  if (allowedEventTypes.includes(eventType)) {
    return eventType;
  }

  return "custom";
}

function getDefaultEventName(eventType: ConversionEventType) {
  if (eventType === "page_view") return "Funnel Page Viewed";
  if (eventType === "cta_click") return "Funnel CTA Clicked";
  if (eventType === "form_view") return "Funnel Form Viewed";
  if (eventType === "form_submit") return "Funnel Form Submitted";
  if (eventType === "lead_created") return "Funnel Lead Created";
  if (eventType === "booking_request") return "Funnel Booking Requested";
  if (eventType === "checkout_click") return "Funnel Checkout Clicked";
  if (eventType === "purchase") return "Funnel Purchase";
  return "Funnel Custom Event";
}

async function loadBusiness(options: {
  businessId: string;
  businessSlug: string;
}) {
  const { businessId, businessSlug } = options;

  if (businessId) {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", businessId)
      .single();

    if (error || !data) return null;

    return data as BusinessRow;
  }

  if (businessSlug) {
    const { data, error } = await supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("slug", businessSlug)
      .single();

    if (error || !data) return null;

    return data as BusinessRow;
  }

  return null;
}

async function loadFunnel(options: {
  businessId: string;
  funnelId: string;
  funnelSlug: string;
}) {
  const { businessId, funnelId, funnelSlug } = options;

  if (!funnelId && !funnelSlug) return null;

  let query = supabaseAdmin
    .from("funnels")
    .select("id, business_id, name, slug, status, is_published")
    .eq("business_id", businessId);

  if (funnelId) {
    query = query.eq("id", funnelId);
  } else {
    query = query.eq("slug", funnelSlug);
  }

  const { data, error } = await query.single();

  if (error || !data) return null;

  return data as FunnelRow;
}

async function loadFunnelPage(options: {
  businessId: string;
  funnelId?: string | null;
  funnelPageId: string;
  pageSlug: string;
}) {
  const { businessId, funnelId, funnelPageId, pageSlug } = options;

  if (!funnelPageId && !pageSlug) return null;

  let query = supabaseAdmin
    .from("funnel_pages")
    .select(
      "id, business_id, funnel_id, title, slug, page_type, is_published"
    )
    .eq("business_id", businessId);

  if (funnelId) {
    query = query.eq("funnel_id", funnelId);
  }

  if (funnelPageId) {
    query = query.eq("id", funnelPageId);
  } else {
    query = query.eq("slug", pageSlug);
  }

  const { data, error } = await query.single();

  if (error || !data) return null;

  return data as FunnelPageRow;
}

async function loadLeadForm(options: {
  businessId: string;
  funnelId?: string | null;
  funnelPageId?: string | null;
  leadFormId: string;
  formSlug: string;
}) {
  const { businessId, funnelId, funnelPageId, leadFormId, formSlug } = options;

  if (!leadFormId && !formSlug && !funnelId && !funnelPageId) {
    return null;
  }

  let query = supabaseAdmin
    .from("lead_forms")
    .select(
      "id, business_id, funnel_id, funnel_page_id, name, slug, status, is_active, is_published"
    )
    .eq("business_id", businessId);

  if (leadFormId) {
    query = query.eq("id", leadFormId);
  } else if (formSlug) {
    query = query.eq("slug", formSlug);
  } else if (funnelPageId) {
    query = query.eq("funnel_page_id", funnelPageId);
  } else if (funnelId) {
    query = query.eq("funnel_id", funnelId);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  return data as LeadFormRow;
}

async function verifyOptionalRecord(options: {
  table: "funnel_submissions" | "leads" | "orders";
  id: string;
  businessId: string;
}) {
  const { table, id, businessId } = options;

  if (!id) return null;

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("id, business_id")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle();

  if (error || !data) return null;

  return data as {
    id: string;
    business_id: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConversionEventBody;

    const { businessId, businessSlug } = getBusinessIdentifiers(body);
    const { funnelId, funnelSlug } = getFunnelIdentifiers(body);
    const { funnelPageId, pageSlug } = getPageIdentifiers(body);
    const { leadFormId, formSlug } = getFormIdentifiers(body);

    const eventType = normalizeEventType(body.eventType || body.event_type);
    const eventName =
      cleanString(body.eventName || body.event_name) ||
      getDefaultEventName(eventType);

    const valueCents = getNumber(body.valueCents ?? body.value_cents, 0);
    const currency = normalizeCurrency(body.currency);

    const source = cleanString(body.source) || "funnel";
    const pageUrl = cleanString(body.pageUrl || body.page_url);
    const referrer = cleanString(body.referrer);

    const sessionId = cleanString(body.sessionId || body.session_id);
    const visitorId = cleanString(body.visitorId || body.visitor_id);

    const funnelSubmissionId = cleanString(
      body.funnelSubmissionId || body.funnel_submission_id
    );

    const leadId = cleanString(body.leadId || body.lead_id);
    const orderId = cleanString(body.orderId || body.order_id);

    const userAgent = getUserAgent(request);
    const ipAddress = getClientIp(request);
    const utmData = getUtmData(body);

    const metadata =
      body.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    if (!businessId && !businessSlug) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId or businessSlug is required.",
        },
        { status: 400 }
      );
    }

    const business = await loadBusiness({
      businessId,
      businessSlug,
    });

    if (!business) {
      return NextResponse.json(
        {
          success: false,
          error: "Business not found.",
        },
        { status: 404 }
      );
    }

    const funnel = await loadFunnel({
      businessId: business.id,
      funnelId,
      funnelSlug,
    });

    const funnelPage = await loadFunnelPage({
      businessId: business.id,
      funnelId: funnel?.id || funnelId || null,
      funnelPageId,
      pageSlug,
    });

    const leadForm = await loadLeadForm({
      businessId: business.id,
      funnelId: funnel?.id || funnelId || null,
      funnelPageId: funnelPage?.id || funnelPageId || null,
      leadFormId,
      formSlug,
    });

    const verifiedSubmission = await verifyOptionalRecord({
      table: "funnel_submissions",
      id: funnelSubmissionId,
      businessId: business.id,
    });

    const verifiedLead = await verifyOptionalRecord({
      table: "leads",
      id: leadId,
      businessId: business.id,
    });

    const verifiedOrder = await verifyOptionalRecord({
      table: "orders",
      id: orderId,
      businessId: business.id,
    });

    const { data: event, error: eventError } = await supabaseAdmin
      .from("conversion_events")
      .insert({
        business_id: business.id,

        funnel_id: funnel?.id || funnelId || null,
        funnel_page_id: funnelPage?.id || funnelPageId || null,
        lead_form_id: leadForm?.id || leadFormId || null,
        funnel_submission_id: verifiedSubmission?.id || null,
        lead_id: verifiedLead?.id || null,
        order_id: verifiedOrder?.id || null,

        event_name: eventName,
        event_type: eventType,

        value_cents: valueCents,
        currency,

        source,
        page_url: pageUrl || null,
        referrer: referrer || null,
        user_agent: userAgent,
        ip_address: ipAddress,

        session_id: sessionId || null,
        visitor_id: visitorId || null,

        ...utmData,

        metadata: {
          ...metadata,
          businessName: business.name,
          businessSlug: business.slug,
          funnelName: funnel?.name || null,
          funnelSlug: funnel?.slug || funnelSlug || null,
          funnelPageTitle: funnelPage?.title || null,
          pageSlug: funnelPage?.slug || pageSlug || null,
          leadFormName: leadForm?.name || null,
          formSlug: leadForm?.slug || formSlug || null,
          rawIds: {
            funnelId: funnelId || null,
            funnelPageId: funnelPageId || null,
            leadFormId: leadFormId || null,
            funnelSubmissionId: funnelSubmissionId || null,
            leadId: leadId || null,
            orderId: orderId || null,
          },
        },
      })
      .select()
      .single();

    if (eventError) throw eventError;

    return NextResponse.json({
      success: true,
      event,
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
      },
      funnel: funnel
        ? {
            id: funnel.id,
            name: funnel.name,
            slug: funnel.slug,
          }
        : null,
      funnelPage: funnelPage
        ? {
            id: funnelPage.id,
            title: funnelPage.title,
            slug: funnelPage.slug,
          }
        : null,
      leadForm: leadForm
        ? {
            id: leadForm.id,
            name: leadForm.name,
            slug: leadForm.slug,
          }
        : null,
    });
  } catch (error) {
    console.error("Conversion event error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to track conversion event."),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const businessId = cleanString(searchParams.get("businessId"));
    const funnelId = cleanString(searchParams.get("funnelId"));
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
      .from("conversion_events")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (funnelId) {
      query = query.eq("funnel_id", funnelId);
    }

    if (eventType && allowedEventTypes.includes(eventType as ConversionEventType)) {
      query = query.eq("event_type", eventType);
    }

    const { data: events, error } = await query;

    if (error) throw error;

    const totals = {
      pageViews:
        events?.filter((event) => event.event_type === "page_view").length ?? 0,
      ctaClicks:
        events?.filter((event) => event.event_type === "cta_click").length ?? 0,
      formViews:
        events?.filter((event) => event.event_type === "form_view").length ?? 0,
      formSubmits:
        events?.filter((event) => event.event_type === "form_submit").length ??
        0,
      leadsCreated:
        events?.filter((event) => event.event_type === "lead_created").length ??
        0,
      checkoutClicks:
        events?.filter((event) => event.event_type === "checkout_click")
          .length ?? 0,
      purchases:
        events?.filter((event) => event.event_type === "purchase").length ?? 0,
      revenueCents:
        events
          ?.filter((event) => event.event_type === "purchase")
          .reduce(
            (sum, event) => sum + Number(event.value_cents ?? 0),
            0
          ) ?? 0,
    };

    return NextResponse.json({
      success: true,
      events: events ?? [],
      totals,
    });
  } catch (error) {
    console.error("Conversion events GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load conversion events."),
      },
      { status: 500 }
    );
  }
}