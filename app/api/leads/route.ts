import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type LeadPayload = {
  businessId: string;
  fullName?: string;
  email?: string;
  phone?: string;
  company?: string;
  source?: string;
  stage?: string;
  notes?: string;
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
      .from("leads")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      leads: data ?? [],
    });
  } catch (error) {
    console.error("Leads GET error:", error);

    return NextResponse.json(
      { error: "Unable to load leads." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LeadPayload;

    if (!body.businessId) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    if (!body.email?.trim() && !body.phone?.trim()) {
      return NextResponse.json(
        { error: "Email or phone is required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("leads")
      .insert({
        business_id: body.businessId,
        full_name: body.fullName?.trim() || null,
        email: body.email?.trim() || null,
        phone: body.phone?.trim() || null,
        company: body.company?.trim() || null,
        source: body.source?.trim() || "website",
        stage: body.stage?.trim() || "new",
        notes: body.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      lead: data,
    });
  } catch (error) {
    console.error("Leads POST error:", error);

    return NextResponse.json(
      { error: "Unable to create lead." },
      { status: 500 }
    );
  }
}