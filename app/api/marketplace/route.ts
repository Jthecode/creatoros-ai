import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type MarketplaceItem = {
  title: string;
  description: string;
  category: string;
  icon?: string;
  price_cents?: number;
};

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("marketplace_items")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      items: data ?? [],
    });
  } catch (error) {
    console.error("Marketplace GET error:", error);

    return NextResponse.json(
      {
        error: "Unable to load marketplace items.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as MarketplaceItem;

    if (!body.title?.trim()) {
      return NextResponse.json(
        {
          error: "Title is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!body.category?.trim()) {
      return NextResponse.json(
        {
          error: "Category is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("marketplace_items")
      .insert({
        title: body.title,
        description: body.description ?? "",
        category: body.category,
        icon: body.icon ?? "Package",
        price_cents: body.price_cents ?? 0,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      item: data,
    });
  } catch (error) {
    console.error("Marketplace POST error:", error);

    return NextResponse.json(
      {
        error: "Unable to create marketplace item.",
      },
      {
        status: 500,
      }
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
          error: "Marketplace item id is required.",
        },
        {
          status: 400,
        }
      );
    }

    const { error } = await supabaseAdmin
      .from("marketplace_items")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Marketplace DELETE error:", error);

    return NextResponse.json(
      {
        error: "Unable to delete marketplace item.",
      },
      {
        status: 500,
      }
    );
  }
}