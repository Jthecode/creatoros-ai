import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type TeamMemberBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
  status?: string | null;
  permissions?: string[] | null;
  metadata?: Record<string, unknown> | null;
};

const allowedRoles = ["owner", "admin", "manager", "member", "viewer"];
const allowedStatuses = ["active", "invited", "pending", "disabled", "removed"];

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: TeamMemberBody) {
  return cleanString(body.businessId || body.business_id);
}

function normalizeRole(value: unknown) {
  const role = cleanString(value).toLowerCase();
  return allowedRoles.includes(role) ? role : "member";
}

function normalizeStatus(value: unknown) {
  const status = cleanString(value).toLowerCase();
  return allowedStatuses.includes(status) ? status : "invited";
}

function normalizePermissions(value: unknown) {
  if (!Array.isArray(value)) return ["View Analytics"];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanMember(row: Record<string, unknown>) {
  return {
    ...row,
    businessId: row.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackTeamEvent(params: {
  businessId: string;
  event: string;
  memberId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "team_members",
      team_member_id: params.memberId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Team analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const id = searchParams.get("id");
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

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
      .from("team_members")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (role) query = query.eq("role", role);
    if (status) query = query.eq("status", status);

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,role.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      members: Array.isArray(data) ? data.map(cleanMember) : [],
    });
  } catch (error) {
    console.error("Team members GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load team members."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as TeamMemberBody;

    const businessId = getBusinessId(body);
    const name = cleanString(body.name);
    const email = cleanString(body.email).toLowerCase();
    const role = normalizeRole(body.role);
    const status = normalizeStatus(body.status);
    const permissions = normalizePermissions(body.permissions);

    if (!businessId) {
      return NextResponse.json(
        {
          success: false,
          error: "businessId is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: "Member name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "Member email is required.",
        },
        { status: 400 }
      );
    }

    const { data: existingMember, error: existingError } = await supabaseAdmin
      .from("team_members")
      .select("id")
      .eq("business_id", businessId)
      .eq("email", email)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existingMember) {
      return NextResponse.json(
        {
          success: false,
          error: "This team member already exists for this business.",
        },
        { status: 409 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("team_members")
      .insert({
        business_id: businessId,
        name,
        email,
        role,
        status,
        permissions,
        metadata: {
          ...(body.metadata ?? {}),
          invitedAt: new Date().toISOString(),
          invitedFrom: "team_api",
        },
      })
      .select()
      .single();

    if (error) throw error;

    await trackTeamEvent({
      businessId,
      event: "team_member_invited",
      memberId: data.id,
      metadata: {
        role,
        status,
        email,
        permissions,
      },
    });

    return NextResponse.json(
      {
        success: true,
        member: cleanMember(data),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Team members POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create team member."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as TeamMemberBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "Team member ID is required.",
        },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.name !== undefined) {
      const name = cleanString(body.name);

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: "Member name cannot be empty.",
          },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.email !== undefined) {
      const email = cleanString(body.email).toLowerCase();

      if (!email) {
        return NextResponse.json(
          {
            success: false,
            error: "Member email cannot be empty.",
          },
          { status: 400 }
        );
      }

      updates.email = email;
    }

    if (body.role !== undefined) {
      updates.role = normalizeRole(body.role);
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(body.status);
    }

    if (body.permissions !== undefined) {
      updates.permissions = normalizePermissions(body.permissions);
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No team member updates provided.",
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("team_members")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackTeamEvent({
      businessId: String(data.business_id),
      event: "team_member_updated",
      memberId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
        role: data.role,
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      member: cleanMember(data),
    });
  } catch (error) {
    console.error("Team members PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update team member."),
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
        {
          success: false,
          error: "Team member ID is required.",
        },
        { status: 400 }
      );
    }

    const { data: member, error: loadError } = await supabaseAdmin
      .from("team_members")
      .select("id, business_id, role, status, email")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin
      .from("team_members")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (member?.business_id) {
      await trackTeamEvent({
        businessId: member.business_id,
        event: "team_member_removed",
        memberId: id,
        metadata: {
          role: member.role,
          status: member.status,
          email: member.email,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Team members DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to remove team member."),
      },
      { status: 500 }
    );
  }
}