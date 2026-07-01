import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const businessId = formData.get("businessId");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "File is required." },
        { status: 400 }
      );
    }

    if (typeof businessId !== "string" || businessId.length === 0) {
      return NextResponse.json(
        { error: "businessId is required." },
        { status: 400 }
      );
    }

    const extension =
      file.name.split(".").pop()?.toLowerCase() ?? "bin";

    const filename = `${randomUUID()}.${extension}`;

    const storagePath = `${businessId}/${filename}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("business-files")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from("business-files")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    const { data: record, error: insertError } =
      await supabaseAdmin
        .from("files")
        .insert({
          business_id: businessId,
          filename: file.name,
          storage_path: storagePath,
          public_url: publicUrl,
          mime_type: file.type,
          size_bytes: file.size,
        })
        .select()
        .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      file: record,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return NextResponse.json(
      {
        error: "Unable to upload file.",
      },
      {
        status: 500,
      }
    );
  }
}