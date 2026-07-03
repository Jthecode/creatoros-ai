import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type CommandBody = {
  businessId?: string;
  business_id?: string;
  prompt?: string;
  mode?: "plan" | "execute";
};

type CommandActionType =
  | "website"
  | "funnel"
  | "product"
  | "storefront"
  | "marketing"
  | "automation"
  | "ai_agent"
  | "lead"
  | "analytics";

type CommandAction = {
  type: CommandActionType;
  label: string;
  status: "planned" | "completed" | "failed";
  message: string;
  href?: string;
  resourceId?: string;
};

type BusinessRow = {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  audience: string | null;
  slug: string | null;
};

type CreatedResource = {
  type: "funnel" | "funnel_page";
  id: string;
  label: string;
  href?: string;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: CommandBody) {
  return cleanString(body.businessId || body.business_id);
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectActions(prompt: string): CommandAction[] {
  const text = prompt.toLowerCase();
  const actions: CommandAction[] = [];

  if (
    includesAny(text, [
      "funnel",
      "sales funnel",
      "lead funnel",
      "offer funnel",
      "booking funnel",
      "launch funnel",
      "opt in",
      "opt-in",
      "lead magnet",
      "capture leads",
      "lead capture",
      "thank you page",
      "thank-you page",
      "upsell",
      "downsell",
      "webinar funnel",
      "conversion funnel",
      "landing page",
      "sales page",
    ])
  ) {
    actions.push({
      type: "funnel",
      label: "AI Funnel Builder",
      status: "planned",
      message:
        "Create a conversion funnel with landing, offer, lead capture, and thank-you pages.",
    });
  }

  if (
    includesAny(text, [
      "website",
      "web site",
      "homepage",
      "home page",
      "about page",
      "services page",
      "contact page",
      "faq",
      "seo page",
    ])
  ) {
    actions.push({
      type: "website",
      label: "AI Website Builder",
      status: "planned",
      message:
        "Create website pages like Home, About, Services, FAQ, Contact, and SEO content.",
    });
  }

  if (
    includesAny(text, [
      "product",
      "offer",
      "service",
      "checkout",
      "package",
      "pricing",
      "subscription",
      "membership",
      "digital product",
    ])
  ) {
    actions.push({
      type: "product",
      label: "Product / Offer",
      status: "planned",
      message: "Create or improve a sellable product or service offer.",
    });
  }

  if (
    includesAny(text, [
      "storefront",
      "store front",
      "shop page",
      "public store",
      "online store",
    ])
  ) {
    actions.push({
      type: "storefront",
      label: "Storefront",
      status: "planned",
      message: "Update public storefront copy, positioning, and sales message.",
    });
  }

  if (
    includesAny(text, [
      "marketing",
      "campaign",
      "social",
      "email",
      "launch",
      "ads",
      "content",
      "caption",
      "promotion",
      "promote",
    ])
  ) {
    actions.push({
      type: "marketing",
      label: "Marketing",
      status: "planned",
      message: "Generate marketing ideas, content angles, and launch assets.",
    });
  }

  if (
    includesAny(text, [
      "automation",
      "automate",
      "follow up",
      "follow-up",
      "workflow",
      "sequence",
      "nurture",
      "reminder",
    ])
  ) {
    actions.push({
      type: "automation",
      label: "Automation",
      status: "planned",
      message: "Create workflow ideas for follow-up, sales, or operations.",
    });
  }

  if (
    includesAny(text, [
      "ai employee",
      "assistant",
      "sales rep",
      "support",
      "agent",
      "chatbot",
      "ai worker",
    ])
  ) {
    actions.push({
      type: "ai_agent",
      label: "AI Employee",
      status: "planned",
      message: "Create or improve an AI employee for this business.",
    });
  }

  if (
    includesAny(text, [
      "lead",
      "leads",
      "customer",
      "customers",
      "crm",
      "contact list",
    ])
  ) {
    actions.push({
      type: "lead",
      label: "Lead / CRM System",
      status: "planned",
      message: "Create a lead capture or CRM growth plan for this business.",
    });
  }

  if (
    includesAny(text, [
      "analytics",
      "traffic",
      "conversion",
      "conversions",
      "stats",
      "report",
      "tracking",
    ])
  ) {
    actions.push({
      type: "analytics",
      label: "Analytics",
      status: "planned",
      message: "Review business performance, traffic, and conversion signals.",
    });
  }

  if (actions.length === 0) {
    actions.push(
      {
        type: "funnel",
        label: "AI Funnel Builder",
        status: "planned",
        message: "Create a simple funnel to turn visitors into leads or buyers.",
      },
      {
        type: "website",
        label: "Website Builder",
        status: "planned",
        message: "Build or improve the public website for this business.",
      },
      {
        type: "marketing",
        label: "Growth Plan",
        status: "planned",
        message: "Create a simple growth plan from the command.",
      }
    );
  }

  return actions;
}

function inferFunnelGoal(prompt: string) {
  const text = prompt.toLowerCase();

  if (includesAny(text, ["book", "booking", "appointment", "call", "consultation"])) {
    return "Book more calls";
  }

  if (includesAny(text, ["lead", "leads", "email list", "opt in", "opt-in"])) {
    return "Capture leads";
  }

  if (includesAny(text, ["sell", "sales", "checkout", "buy", "purchase"])) {
    return "Increase sales";
  }

  if (includesAny(text, ["launch", "drop", "release", "campaign"])) {
    return "Launch an offer";
  }

  if (includesAny(text, ["webinar", "training", "workshop"])) {
    return "Register attendees";
  }

  return "Convert visitors into customers";
}

function inferFunnelName(prompt: string, businessName: string) {
  const text = prompt.toLowerCase();

  if (text.includes("booking")) return `${businessName} Booking Funnel`;
  if (text.includes("lead")) return `${businessName} Lead Funnel`;
  if (text.includes("launch")) return `${businessName} Launch Funnel`;
  if (text.includes("webinar")) return `${businessName} Webinar Funnel`;
  if (text.includes("sales")) return `${businessName} Sales Funnel`;
  if (text.includes("offer")) return `${businessName} Offer Funnel`;

  return `${businessName} Growth Funnel`;
}

function inferFunnelOffer(prompt: string, business: BusinessRow) {
  const text = prompt.toLowerCase();

  if (text.includes("service")) return "A high-value service offer";
  if (text.includes("course")) return "A course or digital education offer";
  if (text.includes("membership")) return "A recurring membership offer";
  if (text.includes("consultation") || text.includes("call")) {
    return "A consultation or booking offer";
  }

  if (business.industry) {
    return `${titleCase(business.industry)} offer`;
  }

  return "Core business offer";
}

async function createUniqueFunnelSlug(businessId: string, name: string) {
  const baseSlug = slugify(name) || "ai-funnel";

  const { data, error } = await supabaseAdmin
    .from("funnels")
    .select("id, slug")
    .eq("business_id", businessId)
    .ilike("slug", `${baseSlug}%`);

  if (error) throw error;

  const existingSlugs = new Set((data ?? []).map((item) => item.slug));

  if (!existingSlugs.has(baseSlug)) {
    return baseSlug;
  }

  for (let index = 2; index <= 50; index += 1) {
    const candidate = `${baseSlug}-${index}`;

    if (!existingSlugs.has(candidate)) {
      return candidate;
    }
  }

  return `${baseSlug}-${Date.now()}`;
}

function buildPageHtml(options: {
  eyebrow: string;
  headline: string;
  subheadline: string;
  body: string;
  ctaText: string;
  ctaUrl: string | null;
}) {
  const ctaHref = options.ctaUrl || "#";

  return `
<section style="min-height:100vh;background:#050505;color:#ffffff;padding:72px 20px;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <div style="display:inline-flex;border:1px solid rgba(250,204,21,.3);background:rgba(250,204,21,.1);color:#fde68a;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.16em;">
      ${escapeHtml(options.eyebrow)}
    </div>

    <h1 style="margin:28px 0 0;font-size:clamp(40px,8vw,84px);line-height:.95;font-weight:950;letter-spacing:-.06em;">
      ${escapeHtml(options.headline)}
    </h1>

    <p style="max-width:760px;margin:24px 0 0;color:#d4d4d8;font-size:20px;line-height:1.7;font-weight:600;">
      ${escapeHtml(options.subheadline)}
    </p>

    <p style="max-width:720px;margin:24px 0 0;color:#a1a1aa;font-size:16px;line-height:1.8;">
      ${escapeHtml(options.body)}
    </p>

    <div style="margin-top:36px;display:flex;flex-wrap:wrap;gap:14px;">
      <a href="${escapeHtml(ctaHref)}" style="display:inline-flex;align-items:center;justify-content:center;border-radius:18px;background:#facc15;color:#000000;padding:16px 24px;text-decoration:none;font-weight:950;">
        ${escapeHtml(options.ctaText)}
      </a>

      <span style="display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:16px 24px;color:#fef3c7;font-weight:800;">
        Powered by CreatorOS AI
      </span>
    </div>
  </div>
</section>
`.trim();
}

function buildStarterFunnelPages(options: {
  business: BusinessRow;
  prompt: string;
  funnelName: string;
  funnelSlug: string;
  goal: string;
  offer: string;
}) {
  const { business, prompt, funnelName, funnelSlug, goal, offer } = options;

  const businessName = business.name || "This Business";
  const audience = business.audience || "your ideal customers";
  const businessSlug = business.slug || "business";

  const funnelBaseHref = `/funnel/${businessSlug}/${funnelSlug}`;
  const offerHref = `${funnelBaseHref}/offer`;
  const thankYouHref = `${funnelBaseHref}/thank-you`;
  const storefrontHref = business.slug ? `/storefront/${business.slug}` : null;

  return [
    {
      title: "Landing Page",
      slug: "landing",
      page_type: "landing",
      headline: `${businessName} is ready to help ${audience}.`,
      subheadline: `A focused funnel built to ${goal.toLowerCase()} with a clear message, strong offer, and simple next step.`,
      body: `This page introduces the main promise behind ${funnelName}. The goal is to quickly explain who this is for, why it matters, and what action visitors should take next. Command used: ${prompt}`,
      cta_text: "See The Offer",
      cta_url: offerHref,
      html_content: buildPageHtml({
        eyebrow: "CreatorOS AI Funnel",
        headline: `${businessName} is ready to help ${audience}.`,
        subheadline: `A focused funnel built to ${goal.toLowerCase()} with a clear message, strong offer, and simple next step.`,
        body: `This page introduces the main promise behind ${funnelName}. The goal is to quickly explain who this is for, why it matters, and what action visitors should take next.`,
        ctaText: "See The Offer",
        ctaUrl: offerHref,
      }),
      sort_order: 1,
      is_published: false,
    },
    {
      title: "Offer Page",
      slug: "offer",
      page_type: "offer",
      headline: `Turn interest into action with ${offer}.`,
      subheadline: `Position the offer, explain the value, remove confusion, and guide visitors toward the next conversion step.`,
      body: `This page should explain the offer, benefits, proof, pricing direction, and why the visitor should act now. Use it as the main conversion page inside this funnel.`,
      cta_text: storefrontHref ? "Go To Storefront" : "Continue",
      cta_url: storefrontHref || thankYouHref,
      html_content: buildPageHtml({
        eyebrow: "Offer Page",
        headline: `Turn interest into action with ${offer}.`,
        subheadline:
          "Position the offer, explain the value, remove confusion, and guide visitors toward the next conversion step.",
        body:
          "This page should explain the offer, benefits, proof, pricing direction, and why the visitor should act now. Use it as the main conversion page inside this funnel.",
        ctaText: storefrontHref ? "Go To Storefront" : "Continue",
        ctaUrl: storefrontHref || thankYouHref,
      }),
      sort_order: 2,
      is_published: false,
    },
    {
      title: "Thank You Page",
      slug: "thank-you",
      page_type: "thank_you",
      headline: "You are all set.",
      subheadline:
        "Confirm the action, explain what happens next, and keep the customer moving through the journey.",
      body: `This page can be used after a lead submits, a customer buys, or someone books a call. It should confirm the next step and keep trust high.`,
      cta_text: "Back To Business",
      cta_url: business.slug ? `/site/${business.slug}` : "/dashboard",
      html_content: buildPageHtml({
        eyebrow: "Thank You",
        headline: "You are all set.",
        subheadline:
          "Confirm the action, explain what happens next, and keep the customer moving through the journey.",
        body:
          "This page can be used after a lead submits, a customer buys, or someone books a call. It should confirm the next step and keep trust high.",
        ctaText: "Back To Business",
        ctaUrl: business.slug ? `/site/${business.slug}` : "/dashboard",
      }),
      sort_order: 3,
      is_published: false,
    },
  ];
}

async function executeFunnelCommand(options: {
  business: BusinessRow;
  prompt: string;
}) {
  const { business, prompt } = options;

  const funnelName = inferFunnelName(prompt, business.name);
  const funnelSlug = await createUniqueFunnelSlug(business.id, funnelName);
  const goal = inferFunnelGoal(prompt);
  const offer = inferFunnelOffer(prompt, business);

  const { data: funnel, error: funnelError } = await supabaseAdmin
    .from("funnels")
    .insert({
      business_id: business.id,
      name: funnelName,
      slug: funnelSlug,
      description: `AI-generated funnel created from command: ${prompt}`,
      goal,
      target_audience: business.audience || "Ideal customers",
      offer,
      status: "draft",
      is_published: false,
    })
    .select("id, name, slug")
    .single();

  if (funnelError) throw funnelError;

  const starterPages = buildStarterFunnelPages({
    business,
    prompt,
    funnelName,
    funnelSlug,
    goal,
    offer,
  });

  const pagesToInsert = starterPages.map((page) => ({
    funnel_id: funnel.id,
    business_id: business.id,
    ...page,
  }));

  const { data: pages, error: pagesError } = await supabaseAdmin
    .from("funnel_pages")
    .insert(pagesToInsert)
    .select("id, title, slug");

  if (pagesError) throw pagesError;

  const funnelHref = `/dashboard/business/${business.id}/funnels`;
  const publicHref = business.slug
    ? `/funnel/${business.slug}/${funnel.slug}`
    : funnelHref;

  const resources: CreatedResource[] = [
    {
      type: "funnel",
      id: funnel.id,
      label: funnel.name,
      href: publicHref,
    },
    ...((pages ?? []).map((page) => ({
      type: "funnel_page" as const,
      id: page.id,
      label: page.title,
      href: business.slug
        ? `/funnel/${business.slug}/${funnel.slug}/${page.slug}`
        : funnelHref,
    })) ?? []),
  ];

  return {
    funnel,
    pages: pages ?? [],
    href: funnelHref,
    publicHref,
    resources,
  };
}

async function executeActions(options: {
  business: BusinessRow;
  prompt: string;
  actions: CommandAction[];
}) {
  const { business, prompt, actions } = options;

  const createdResources: CreatedResource[] = [];
  let funnelExecution:
    | Awaited<ReturnType<typeof executeFunnelCommand>>
    | null = null;

  const updatedActions: CommandAction[] = [];

  for (const action of actions) {
    if (action.type !== "funnel") {
      updatedActions.push({
        ...action,
        status: "planned",
      });

      continue;
    }

    try {
      funnelExecution = await executeFunnelCommand({
        business,
        prompt,
      });

      createdResources.push(...funnelExecution.resources);

      updatedActions.push({
        ...action,
        status: "completed",
        message: `Created ${funnelExecution.funnel.name} with ${funnelExecution.pages.length} starter funnel pages.`,
        href: funnelExecution.href,
        resourceId: funnelExecution.funnel.id,
      });
    } catch (error) {
      updatedActions.push({
        ...action,
        status: "failed",
        message: getErrorMessage(error, "Unable to create funnel."),
      });
    }
  }

  return {
    actions: updatedActions,
    createdResources,
    funnelExecution,
  };
}

function buildResult(options: {
  prompt: string;
  businessName: string;
  actions: CommandAction[];
  mode: "plan" | "execute";
  createdResources?: CreatedResource[];
}) {
  const { prompt, businessName, actions, mode, createdResources = [] } = options;

  const createdFunnels = createdResources.filter(
    (resource) => resource.type === "funnel"
  );

  const hasFunnelAction = actions.some((action) => action.type === "funnel");

  return {
    summary:
      mode === "execute" && createdFunnels.length > 0
        ? `CreatorOS AI created a funnel command execution for ${businessName}.`
        : `CreatorOS AI created a command plan for ${businessName}.`,
    prompt,
    recommendedNextMove:
      mode === "execute" && createdFunnels.length > 0
        ? "Open the AI Funnel Builder, review the generated funnel pages, edit the copy, then publish when ready."
        : hasFunnelAction
          ? "Review the funnel plan, then open the AI Funnel Builder to create or edit the sales funnel."
          : "Review the plan, then use the Website Builder, Product Manager, Marketing Center, Automations, and AI Employees tools to execute it.",
    actions,
    createdResources,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CommandBody;

    const businessId = getBusinessId(body);
    const prompt = cleanString(body.prompt);
    const mode = body.mode === "execute" ? "execute" : "plan";

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Command prompt is required." },
        { status: 400 }
      );
    }

    const { data: business, error: businessError } = await supabaseAdmin
      .from("businesses")
      .select("id, name, description, industry, audience, slug")
      .eq("id", businessId)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: "Business not found." },
        { status: 404 }
      );
    }

    const detectedActions = detectActions(prompt);

    const execution =
      mode === "execute"
        ? await executeActions({
            business: business as BusinessRow,
            prompt,
            actions: detectedActions,
          })
        : {
            actions: detectedActions,
            createdResources: [] as CreatedResource[],
            funnelExecution: null,
          };

    const result = buildResult({
      prompt,
      businessName: business.name,
      actions: execution.actions,
      mode,
      createdResources: execution.createdResources,
    });

    const hasFailedAction = execution.actions.some(
      (action) => action.status === "failed"
    );

    const hasCompletedAction = execution.actions.some(
      (action) => action.status === "completed"
    );

    const commandStatus =
      mode === "execute"
        ? hasFailedAction && !hasCompletedAction
          ? "failed"
          : "completed"
        : "planned";

    const { data: commandRun, error: commandError } = await supabaseAdmin
      .from("command_runs")
      .insert({
        business_id: businessId,
        user_prompt: prompt,
        status: commandStatus,
        actions: execution.actions,
        result: {
          ...result,
          business,
          mode,
        },
      })
      .select()
      .single();

    if (commandError) throw commandError;

    await supabaseAdmin.from("analytics_events").insert({
      business_id: businessId,
      event: mode === "execute" ? "command_center_execute" : "command_center_run",
      source: "command_center",
      revenue: 0,
      metadata: {
        mode,
        actionCount: execution.actions.length,
        commandRunId: commandRun.id,
        createdResources: execution.createdResources,
      },
    });

    return NextResponse.json({
      success: true,
      commandRun,
      result,
    });
  } catch (error) {
    console.error("Command center error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to run command."),
      },
      { status: 500 }
    );
  }
}