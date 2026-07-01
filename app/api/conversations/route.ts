import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type ConversationStatus = "open" | "pending" | "resolved" | "closed";

type ConversationPayload = {
  id?: string;
  businessId?: string;
  business_id?: string;
  customerName?: string;
  customer_name?: string;
  customerEmail?: string;
  customer_email?: string;
  channel?: string;
  status?: ConversationStatus | string;
  subject?: string | null;
  message?: string;
  last_message?: string;
  unread_count?: number;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getBusinessId(body: ConversationPayload) {
  return cleanString(body.businessId || body.business_id);
}

function normalizeStatus(value: unknown): ConversationStatus {
  const status = cleanString(value).toLowerCase();

  if (
    status === "open" ||
    status === "pending" ||
    status === "resolved" ||
    status === "closed"
  ) {
    return status;
  }

  return "open";
}

function cleanConversation(row: Record<string, unknown>) {
  return {
    ...row,
    businessId: row.business_id,
  };
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

async function trackConversationEvent(params: {
  businessId: string;
  event: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "conversations",
      conversation_id: params.conversationId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("Conversation analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId");
    const id = request.nextUrl.searchParams.get("id");
    const status = request.nextUrl.searchParams.get("status");
    const channel = request.nextUrl.searchParams.get("channel");
    const q = request.nextUrl.searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (status) query = query.eq("status", status);
    if (channel) query = query.eq("channel", channel);

    if (q) {
      const search = q.replace(/[%_,]/g, "").trim();

      if (search) {
        query = query.or(
          `customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,subject.ilike.%${search}%,last_message.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      conversations: Array.isArray(data)
        ? data.map((row) => cleanConversation(row))
        : [],
    });
  } catch (error) {
    console.error("Conversations GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load conversations."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConversationPayload;

    const businessId = getBusinessId(body);
    const customerName =
      cleanString(body.customerName || body.customer_name) || "Website Visitor";
    const customerEmail = cleanString(body.customerEmail || body.customer_email);
    const channel = cleanString(body.channel) || "storefront";
    const message = cleanString(body.message || body.last_message);
    const status = normalizeStatus(body.status);
    const subject =
      cleanString(body.subject) ||
      (customerEmail ? `Conversation with ${customerEmail}` : "New conversation");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required." },
        { status: 400 }
      );
    }

    let conversationId = "";
    let createdNewConversation = false;

    if (customerEmail) {
      const { data: existingConversation, error: existingError } =
        await supabaseAdmin
          .from("conversations")
          .select("*")
          .eq("business_id", businessId)
          .eq("customer_email", customerEmail)
          .neq("status", "closed")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (existingError) throw existingError;

      if (existingConversation?.id) {
        conversationId = existingConversation.id;

        const existingMetadata =
          typeof existingConversation.metadata === "object" &&
          existingConversation.metadata !== null
            ? (existingConversation.metadata as Record<string, unknown>)
            : {};

        const existingMessages = Array.isArray(existingMetadata.messages)
          ? existingMetadata.messages
          : [];

        const nextMessages = [
          ...existingMessages,
          {
            role: "user",
            content: message,
            createdAt: new Date().toISOString(),
          },
        ];

        const { error: updateError } = await supabaseAdmin
          .from("conversations")
          .update({
            customer_name: customerName,
            channel,
            status: "open",
            subject,
            last_message: message,
            unread_count: Number(existingConversation.unread_count ?? 0) + 1,
            updated_at: new Date().toISOString(),
            metadata: {
              ...existingMetadata,
              messages: nextMessages,
              lastInboundAt: new Date().toISOString(),
            },
          })
          .eq("id", conversationId);

        if (updateError) throw updateError;
      }
    }

    if (!conversationId) {
      createdNewConversation = true;

      const { data: conversation, error: createError } = await supabaseAdmin
        .from("conversations")
        .insert({
          business_id: businessId,
          customer_name: customerName,
          customer_email: customerEmail || null,
          channel,
          status,
          subject,
          last_message: message,
          unread_count: 1,
          metadata: {
            ...(body.metadata ?? {}),
            messages: [
              {
                role: "user",
                content: message,
                createdAt: new Date().toISOString(),
              },
            ],
            createdFrom: "conversations_api",
          },
        })
        .select()
        .single();

      if (createError) throw createError;

      conversationId = conversation.id;
    }

    const { data: conversationData, error: loadError } = await supabaseAdmin
      .from("conversations")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (loadError) throw loadError;

    await trackConversationEvent({
      businessId,
      event: createdNewConversation
        ? "conversation_created"
        : "conversation_updated",
      conversationId,
      metadata: {
        channel,
        customerEmail: customerEmail || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        conversationId,
        conversation: cleanConversation(conversationData),
      },
      { status: createdNewConversation ? 201 : 200 }
    );
  } catch (error) {
    console.error("Conversations POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to create conversation."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as ConversationPayload;
    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required." },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = getBusinessId(body);
    }

    if (body.customerName !== undefined || body.customer_name !== undefined) {
      updates.customer_name =
        cleanString(body.customerName || body.customer_name) || null;
    }

    if (body.customerEmail !== undefined || body.customer_email !== undefined) {
      updates.customer_email =
        cleanString(body.customerEmail || body.customer_email) || null;
    }

    if (body.channel !== undefined) {
      updates.channel = cleanString(body.channel) || "storefront";
    }

    if (body.status !== undefined) {
      updates.status = normalizeStatus(body.status);
    }

    if (body.subject !== undefined) {
      updates.subject = cleanString(body.subject) || null;
    }

    if (body.message !== undefined || body.last_message !== undefined) {
      updates.last_message = cleanString(body.message || body.last_message);
    }

    if (body.unread_count !== undefined) {
      updates.unread_count = Math.max(0, Number(body.unread_count ?? 0));
    }

    if (body.metadata !== undefined) {
      updates.metadata = body.metadata ?? {};
    }

    updates.updated_at = new Date().toISOString();

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json(
        { success: false, error: "No conversation updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("conversations")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackConversationEvent({
      businessId: String(data.business_id),
      event: "conversation_updated",
      conversationId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
        status: data.status,
      },
    });

    return NextResponse.json({
      success: true,
      conversation: cleanConversation(data),
    });
  } catch (error) {
    console.error("Conversations PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update conversation."),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Conversation ID is required." },
        { status: 400 }
      );
    }

    const { data: conversation, error: loadError } = await supabaseAdmin
      .from("conversations")
      .select("id, business_id, status")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    const { error } = await supabaseAdmin
      .from("conversations")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (conversation?.business_id) {
      await trackConversationEvent({
        businessId: conversation.business_id,
        event: "conversation_deleted",
        conversationId: id,
        metadata: {
          status: conversation.status,
        },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Conversations DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete conversation."),
      },
      { status: 500 }
    );
  }
}