import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type FunnelSubmitBody = {
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

  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;

  formData?: Record<string, unknown>;
  form_data?: Record<string, unknown>;

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

type ParsedRequestBody = {
  body: FunnelSubmitBody;
  isFormPost: boolean;
};

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
  title: string;
  status: string | null;
  is_active: boolean | null;
  is_published: boolean | null;
  success_message: string | null;
  redirect_url: string | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeEmail(value: unknown) {
  return cleanString(value).toLowerCase();
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function getBusinessIdentifiers(body: FunnelSubmitBody) {
  return {
    businessId: cleanString(body.businessId || body.business_id),
    businessSlug: cleanString(body.businessSlug || body.business_slug),
  };
}

function getFunnelIdentifiers(body: FunnelSubmitBody) {
  return {
    funnelId: cleanString(body.funnelId || body.funnel_id),
    funnelSlug: cleanString(body.funnelSlug || body.funnel_slug),
  };
}

function getPageIdentifiers(body: FunnelSubmitBody) {
  return {
    funnelPageId: cleanString(body.funnelPageId || body.funnel_page_id),
    pageSlug: cleanString(body.pageSlug || body.page_slug),
  };
}

function getFormIdentifiers(body: FunnelSubmitBody) {
  return {
    leadFormId: cleanString(body.leadFormId || body.lead_form_id),
    formSlug: cleanString(body.formSlug || body.form_slug),
  };
}

function getFormData(body: FunnelSubmitBody) {
  const rawFormData = body.formData || body.form_data || {};

  if (
    rawFormData &&
    typeof rawFormData === "object" &&
    !Array.isArray(rawFormData)
  ) {
    return rawFormData;
  }

  return {};
}

function getField(
  body: FunnelSubmitBody,
  formData: Record<string, unknown>,
  key: string
) {
  const bodyValue = body[key as keyof FunnelSubmitBody];
  const formValue = formData[key];

  return cleanString(bodyValue || formValue);
}

function getUtmData(body: FunnelSubmitBody) {
  return {
    utm_source: cleanString(body.utm_source) || null,
    utm_medium: cleanString(body.utm_medium) || null,
    utm_campaign: cleanString(body.utm_campaign) || null,
    utm_term: cleanString(body.utm_term) || null,
    utm_content: cleanString(body.utm_content) || null,
  };
}

function safeJsonObject(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }

    return {};
  } catch {
    return {};
  }
}

function formDataToBody(formData: FormData): FunnelSubmitBody {
  const body: FunnelSubmitBody = {};
  const formDataObject: Record<string, unknown> = {};

  for (const [key, value] of formData.entries()) {
    const cleanValue = typeof value === "string" ? value.trim() : "";

    if (key === "metadata") {
      body.metadata = safeJsonObject(value);
      continue;
    }

    if (key === "formData" || key === "form_data") {
      const parsed = safeJsonObject(value);

      body.formData = {
        ...(body.formData || {}),
        ...parsed,
      };

      continue;
    }

    formDataObject[key] = cleanValue;
    (body as Record<string, unknown>)[key] = cleanValue;
  }

  body.formData = {
    ...formDataObject,
    ...(body.formData || {}),
  };

  return body;
}

async function parseRequestBody(
  request: NextRequest
): Promise<ParsedRequestBody> {
  const contentType = request.headers.get("content-type") || "";

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const formData = await request.formData();

    return {
      body: formDataToBody(formData),
      isFormPost: true,
    };
  }

  const jsonBody = (await request.json()) as FunnelSubmitBody;

  return {
    body: jsonBody,
    isFormPost: false,
  };
}

function buildRedirectUrl(options: {
  request: NextRequest;
  redirectUrl?: string | null;
  pageUrl?: string | null;
  fallbackPath?: string;
  success?: boolean;
  message?: string;
}) {
  const {
    request,
    redirectUrl,
    pageUrl,
    fallbackPath = "/",
    success = true,
    message,
  } = options;

  const target = redirectUrl || pageUrl || fallbackPath;
  const url = new URL(target, request.url);

  url.searchParams.set(success ? "submitted" : "error", success ? "1" : "1");

  if (message) {
    url.searchParams.set("message", message.slice(0, 140));
  }

  return url;
}

function jsonOrRedirect(options: {
  request: NextRequest;
  isFormPost: boolean;
  payload: Record<string, unknown>;
  status?: number;
  redirectUrl?: string | null;
  pageUrl?: string | null;
  success?: boolean;
  message?: string;
}) {
  const {
    request,
    isFormPost,
    payload,
    status = 200,
    redirectUrl,
    pageUrl,
    success = true,
    message,
  } = options;

  if (isFormPost) {
    return NextResponse.redirect(
      buildRedirectUrl({
        request,
        redirectUrl,
        pageUrl,
        success,
        message,
      }),
      303
    );
  }

  return NextResponse.json(payload, { status });
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
    .select("id, business_id, funnel_id, title, slug, page_type, is_published")
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
      "id, business_id, funnel_id, funnel_page_id, name, slug, title, status, is_active, is_published, success_message, redirect_url"
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

async function createLead(options: {
  business: BusinessRow;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  source: string;
  formData: Record<string, unknown>;
  metadata: Record<string, unknown>;
}) {
  const {
    business,
    name,
    email,
    phone,
    company,
    message,
    source,
    formData,
    metadata,
  } = options;

  const insertPayload = {
    business_id: business.id,
    name: name || email || phone || "New Funnel Lead",
    full_name: name || email || phone || "New Funnel Lead",
    email: email || null,
    phone: phone || null,
    company: company || null,
    message: message || null,
    source,
    status: "new",
    stage: "new",
    notes: message || null,
    metadata: {
      ...metadata,
      formData,
      businessName: business.name,
    },
  };

  const { data, error } = await supabaseAdmin
    .from("leads")
    .insert(insertPayload)
    .select("id, name, email, phone, status")
    .single();

  if (!error && data) {
    return data;
  }

  const fallbackPayload = {
    business_id: business.id,
    name: name || email || phone || "New Funnel Lead",
    email: email || null,
    phone: phone || null,
    source,
    status: "new",
  };

  const { data: fallbackData, error: fallbackError } = await supabaseAdmin
    .from("leads")
    .insert(fallbackPayload)
    .select("id, name, email, phone, status")
    .single();

  if (fallbackError) throw fallbackError;

  return fallbackData;
}

async function createFunnelSubmission(options: {
  businessId: string;
  funnelId: string | null;
  funnelPageId: string | null;
  leadFormId: string | null;
  leadId: string | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  formData: Record<string, unknown>;
  metadata: Record<string, unknown>;
  pageUrl: string;
  referrer: string;
  userAgent: string | null;
  ipAddress: string | null;
  utmData: ReturnType<typeof getUtmData>;
}) {
  const {
    businessId,
    funnelId,
    funnelPageId,
    leadFormId,
    leadId,
    name,
    email,
    phone,
    company,
    message,
    formData,
    metadata,
    pageUrl,
    referrer,
    userAgent,
    ipAddress,
    utmData,
  } = options;

  const { data, error } = await supabaseAdmin
    .from("funnel_submissions")
    .insert({
      business_id: businessId,
      funnel_id: funnelId,
      funnel_page_id: funnelPageId,
      lead_form_id: leadFormId,
      lead_id: leadId,

      name: name || null,
      email: email || null,
      phone: phone || null,
      company: company || null,
      message: message || null,

      source: "funnel",
      status: "new",

      form_data: formData,
      metadata,

      page_url: pageUrl || null,
      referrer: referrer || null,
      user_agent: userAgent,
      ip_address: ipAddress,

      ...utmData,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function createConversionEvent(options: {
  businessId: string;
  funnelId: string | null;
  funnelPageId: string | null;
  leadFormId: string | null;
  funnelSubmissionId?: string | null;
  leadId?: string | null;
  eventName: string;
  eventType:
    | "form_submit"
    | "lead_created"
    | "booking_request"
    | "custom";
  pageUrl: string;
  referrer: string;
  userAgent: string | null;
  ipAddress: string | null;
  sessionId: string;
  visitorId: string;
  utmData: ReturnType<typeof getUtmData>;
  metadata?: Record<string, unknown>;
}) {
  const {
    businessId,
    funnelId,
    funnelPageId,
    leadFormId,
    funnelSubmissionId,
    leadId,
    eventName,
    eventType,
    pageUrl,
    referrer,
    userAgent,
    ipAddress,
    sessionId,
    visitorId,
    utmData,
    metadata = {},
  } = options;

  const { data, error } = await supabaseAdmin
    .from("conversion_events")
    .insert({
      business_id: businessId,
      funnel_id: funnelId,
      funnel_page_id: funnelPageId,
      lead_form_id: leadFormId,
      funnel_submission_id: funnelSubmissionId || null,
      lead_id: leadId || null,

      event_name: eventName,
      event_type: eventType,

      value_cents: 0,
      currency: "USD",

      source: "funnel",
      page_url: pageUrl || null,
      referrer: referrer || null,
      user_agent: userAgent,
      ip_address: ipAddress,

      session_id: sessionId || null,
      visitor_id: visitorId || null,

      ...utmData,

      metadata,
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

async function createAutomationEvents(options: {
  businessId: string;
  funnelId: string | null;
  funnelPageId: string | null;
  leadFormId: string | null;
  funnelSubmissionId: string | null;
  leadId: string | null;
  businessName: string;
  funnelName: string | null;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadMessage: string;
  pageUrl: string;
}) {
  const {
    businessId,
    funnelId,
    funnelPageId,
    leadFormId,
    funnelSubmissionId,
    leadId,
    businessName,
    funnelName,
    leadName,
    leadEmail,
    leadPhone,
    leadMessage,
    pageUrl,
  } = options;

  const recipientName = leadName || leadEmail || leadPhone || "New Lead";
  const hasEmail = Boolean(leadEmail);
  const hasPhone = Boolean(leadPhone);

  const followUpSubject = `Thanks for reaching out to ${businessName}`;

  const followUpMessage = `Hi ${recipientName},

Thanks for submitting your information${funnelName ? ` through ${funnelName}` : ""}.

We received your request and will follow up with you soon.

${leadMessage ? `Your message: ${leadMessage}` : ""}

- ${businessName}`;

  const internalSubject = `New funnel lead for ${businessName}`;

  const internalMessage = `A new funnel lead was submitted.

Name: ${leadName || "N/A"}
Email: ${leadEmail || "N/A"}
Phone: ${leadPhone || "N/A"}
Funnel: ${funnelName || "N/A"}
Page: ${pageUrl || "N/A"}
Message: ${leadMessage || "N/A"}`;

  const eventsToInsert = [
    {
      business_id: businessId,
      funnel_id: funnelId,
      funnel_page_id: funnelPageId,
      lead_form_id: leadFormId,
      funnel_submission_id: funnelSubmissionId,
      lead_id: leadId,

      event_type: hasEmail || hasPhone ? "lead_follow_up" : "custom",
      status: "pending",

      recipient_email: leadEmail || null,
      recipient_phone: leadPhone || null,
      recipient_name: recipientName,

      subject: followUpSubject,
      message: followUpMessage,

      metadata: {
        source: "funnel_submit",
        pageUrl,
        funnelName,
        automationPurpose: "customer_follow_up",
        hasEmail,
        hasPhone,
      },
    },
    {
      business_id: businessId,
      funnel_id: funnelId,
      funnel_page_id: funnelPageId,
      lead_form_id: leadFormId,
      funnel_submission_id: funnelSubmissionId,
      lead_id: leadId,

      event_type: "internal_notification",
      status: "pending",

      recipient_email: null,
      recipient_phone: null,
      recipient_name: businessName,

      subject: internalSubject,
      message: internalMessage,

      metadata: {
        source: "funnel_submit",
        pageUrl,
        funnelName,
        automationPurpose: "business_owner_notification",
        leadName: leadName || null,
        leadEmail: leadEmail || null,
        leadPhone: leadPhone || null,
      },
    },
  ];

  const { error } = await supabaseAdmin
    .from("automation_events")
    .insert(eventsToInsert);

  if (error) {
    console.error("Unable to create automation events:", error);
  }
}

export async function POST(request: NextRequest) {
  let isFormPost = false;
  let pageUrlForError = "";

  try {
    const parsed = await parseRequestBody(request);
    const body = parsed.body;
    isFormPost = parsed.isFormPost;

    const { businessId, businessSlug } = getBusinessIdentifiers(body);
    const { funnelId, funnelSlug } = getFunnelIdentifiers(body);
    const { funnelPageId, pageSlug } = getPageIdentifiers(body);
    const { leadFormId, formSlug } = getFormIdentifiers(body);

    const formData = getFormData(body);

    const name = getField(body, formData, "name");
    const email = normalizeEmail(body.email || formData.email);
    const phone = getField(body, formData, "phone");
    const company = getField(body, formData, "company");
    const message = getField(body, formData, "message");

    const pageUrl = cleanString(body.pageUrl || body.page_url);
    pageUrlForError = pageUrl;

    const referrer = cleanString(body.referrer);

    const sessionId = cleanString(body.sessionId || body.session_id);
    const visitorId = cleanString(body.visitorId || body.visitor_id);

    const utmData = getUtmData(body);

    const userAgent = getUserAgent(request);
    const ipAddress = getClientIp(request);

    const metadata =
      body.metadata &&
      typeof body.metadata === "object" &&
      !Array.isArray(body.metadata)
        ? body.metadata
        : {};

    if (!businessId && !businessSlug) {
      return jsonOrRedirect({
        request,
        isFormPost,
        payload: {
          success: false,
          error: "businessId or businessSlug is required.",
        },
        status: 400,
        pageUrl,
        success: false,
        message: "Business is required.",
      });
    }

    if (!email && !phone) {
      return jsonOrRedirect({
        request,
        isFormPost,
        payload: {
          success: false,
          error: "Email or phone is required.",
        },
        status: 400,
        pageUrl,
        success: false,
        message: "Email or phone is required.",
      });
    }

    const business = await loadBusiness({
      businessId,
      businessSlug,
    });

    if (!business) {
      return jsonOrRedirect({
        request,
        isFormPost,
        payload: {
          success: false,
          error: "Business not found.",
        },
        status: 404,
        pageUrl,
        success: false,
        message: "Business not found.",
      });
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

    if (leadForm) {
      const formIsActive =
        leadForm.is_active !== false &&
        (leadForm.is_published === true || leadForm.status === "published");

      if (!formIsActive) {
        return jsonOrRedirect({
          request,
          isFormPost,
          payload: {
            success: false,
            error: "This lead form is not published.",
          },
          status: 403,
          pageUrl,
          success: false,
          message: "This form is not available.",
        });
      }
    }

    const lead = await createLead({
      business,
      name,
      email,
      phone,
      company,
      message,
      source: "funnel",
      formData,
      metadata: {
        ...metadata,
        funnelId: funnel?.id || funnelId || null,
        funnelSlug: funnel?.slug || funnelSlug || null,
        funnelPageId: funnelPage?.id || funnelPageId || null,
        pageSlug: funnelPage?.slug || pageSlug || null,
        leadFormId: leadForm?.id || leadFormId || null,
        formSlug: leadForm?.slug || formSlug || null,
        pageUrl,
        referrer,
        sessionId,
        visitorId,
        utmData,
      },
    });

    const submission = await createFunnelSubmission({
      businessId: business.id,
      funnelId: funnel?.id || funnelId || null,
      funnelPageId: funnelPage?.id || funnelPageId || null,
      leadFormId: leadForm?.id || leadFormId || null,
      leadId: lead?.id || null,
      name,
      email,
      phone,
      company,
      message,
      formData,
      metadata: {
        ...metadata,
        businessName: business.name,
        funnelName: funnel?.name || null,
        funnelSlug: funnel?.slug || funnelSlug || null,
        funnelPageTitle: funnelPage?.title || null,
        pageSlug: funnelPage?.slug || pageSlug || null,
        leadFormName: leadForm?.name || null,
        formSlug: leadForm?.slug || formSlug || null,
      },
      pageUrl,
      referrer,
      userAgent,
      ipAddress,
      utmData,
    });

    const eventBasePayload = {
      businessId: business.id,
      funnelId: funnel?.id || funnelId || null,
      funnelPageId: funnelPage?.id || funnelPageId || null,
      leadFormId: leadForm?.id || leadFormId || null,
      funnelSubmissionId: submission.id,
      leadId: lead?.id || null,
      pageUrl,
      referrer,
      userAgent,
      ipAddress,
      sessionId,
      visitorId,
      utmData,
    };

    await Promise.all([
      createConversionEvent({
        ...eventBasePayload,
        eventName: "Funnel Form Submitted",
        eventType: "form_submit",
        metadata: {
          email,
          phone,
          hasMessage: Boolean(message),
        },
      }),

      createConversionEvent({
        ...eventBasePayload,
        eventName: "Funnel Lead Created",
        eventType: "lead_created",
        metadata: {
          leadId: lead?.id || null,
          submissionId: submission.id,
        },
      }),

      createAutomationEvents({
        businessId: business.id,
        funnelId: funnel?.id || funnelId || null,
        funnelPageId: funnelPage?.id || funnelPageId || null,
        leadFormId: leadForm?.id || leadFormId || null,
        funnelSubmissionId: submission.id,
        leadId: lead?.id || null,
        businessName: business.name,
        funnelName: funnel?.name || null,
        leadName: name,
        leadEmail: email,
        leadPhone: phone,
        leadMessage: message,
        pageUrl,
      }),
    ]);

    const successMessage =
      leadForm?.success_message || "Thanks! We received your information.";

    return jsonOrRedirect({
      request,
      isFormPost,
      payload: {
        success: true,
        message: successMessage,
        redirectUrl: leadForm?.redirect_url || null,
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
        lead,
        submission,
        automationQueued: true,
      },
      redirectUrl: leadForm?.redirect_url || null,
      pageUrl,
      success: true,
      message: successMessage,
    });
  } catch (error) {
    console.error("Funnel submit error:", error);

    return jsonOrRedirect({
      request,
      isFormPost,
      payload: {
        success: false,
        error: getErrorMessage(error, "Unable to submit funnel form."),
      },
      status: 500,
      pageUrl: pageUrlForError,
      success: false,
      message: "Unable to submit funnel form.",
    });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    route: "CreatorOS AI Funnel Submit API",
    message: "Use POST to submit funnel lead forms.",
  });
}