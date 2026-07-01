import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type ConversationPayload = {
  businessId: string;
  customerName?: string;
  customerEmail?: string;
  channel?: string;
  message: string;
};

export async function GET(request: NextRequest) {
  try {
    const businessId = request.nextUrl.searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("conversations")
      .select(
        `
        *,
        messages (
          id,
          sender,
          content,
          ai_generated,
          created_at
        )
      `
      )
      .eq("business_id", businessId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      conversations: data ?? [],
    });
  } catch (error) {
    console.error("Conversations GET error:", error);

    return NextResponse.json(
      { error: "Unable to load conversations." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConversationPayload;

    if (!body.businessId) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    let conversationId: string;

    const email = body.customerEmail?.trim() || null;

    const { data: existingConversation, error: existingError } =
      await supabaseAdmin
        .from("conversations")
        .select("id")
        .eq("business_id", body.businessId)
        .eq("customer_email", email)
        .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingConversation) {
      conversationId = existingConversation.id;

      const { error: updateError } = await supabaseAdmin
        .from("conversations")
        .update({
          last_message: body.message,
          unread_count: 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversationId);

      if (updateError) {
        throw updateError;
      }
    } else {
      const { data: conversation, error: createError } = await supabaseAdmin
        .from("conversations")
        .insert({
          business_id: body.businessId,
          customer_name: body.customerName?.trim() || null,
          customer_email: email,
          channel: body.channel || "website",
          status: "open",
          last_message: body.message,
          unread_count: 1,
        })
        .select("id")
        .single();

      if (createError) {
        throw createError;
      }

      conversationId = conversation.id;
    }

    const { data: message, error: messageError } = await supabaseAdmin
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender: body.customerName?.trim() || "Customer",
        content: body.message,
        ai_generated: false,
      })
      .select()
      .single();

    if (messageError) {
      throw messageError;
    }

    return NextResponse.json({
      success: true,
      conversationId,
      message,
    });
  } catch (error) {
    console.error("Conversations POST error:", error);

    return NextResponse.json(
      { error: "Unable to create conversation." },
      { status: 500 }
    );
  }
}