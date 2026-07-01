import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const BUCKET = "business-files";

type FilePatchBody = {
  id?: string;
  businessId?: string;
  business_id?: string;
  name?: string | null;
  folder?: string | null;
  favorite?: boolean;
  metadata?: Record<string, unknown> | null;
};

function cleanString(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;
  return fallback;
}

function cleanSearch(value: string) {
  return value.replace(/[%_,]/g, "").trim();
}

function getFolderFromType(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();

  if (type.startsWith("image/")) return "images";
  if (type.startsWith("video/")) return "videos";
  if (type.startsWith("audio/")) return "marketing";
  if (name.includes("logo") || name.includes("brand")) return "brand-assets";
  if (name.includes("contract") || name.includes("agreement")) return "legal";
  if (name.includes("invoice") || name.includes("finance")) return "finance";
  if (name.includes("product")) return "products";
  if (name.includes("campaign") || name.includes("ad")) return "marketing";

  return "documents";
}

function cleanFile(row: Record<string, unknown>) {
  return {
    ...row,
    businessId: row.business_id,
  };
}

async function trackFileEvent(params: {
  businessId: string;
  event: string;
  fileId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await supabaseAdmin.from("analytics_events").insert({
      business_id: params.businessId,
      event: params.event,
      source: "files",
      file_id: params.fileId ?? null,
      revenue: 0,
      metadata: params.metadata ?? {},
    });
  } catch (error) {
    console.error("File analytics tracking failed:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const businessId = searchParams.get("businessId");
    const id = searchParams.get("id");
    const folder = searchParams.get("folder");
    const q = searchParams.get("q");

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    let query = supabaseAdmin
      .from("business_files")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (id) query = query.eq("id", id);
    if (folder) query = query.eq("folder", folder);

    if (q) {
      const search = cleanSearch(q);

      if (search) {
        query = query.or(
          `name.ilike.%${search}%,file_name.ilike.%${search}%,folder.ilike.%${search}%,file_type.ilike.%${search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      files: Array.isArray(data) ? data.map(cleanFile) : [],
    });
  } catch (error) {
    console.error("Files GET error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to load files."),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const businessId = cleanString(formData.get("businessId"));
    const folderInput = cleanString(formData.get("folder"));

    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File);

    if (!businessId) {
      return NextResponse.json(
        { success: false, error: "businessId is required." },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one file is required." },
        { status: 400 }
      );
    }

    const uploadedFiles = [];

    for (const file of files) {
      const safeName =
        file.name.replace(/[^a-zA-Z0-9._-]/g, "-") || "uploaded-file";

      const folder = folderInput || getFolderFromType(file);

      const filePath = `${businessId}/${folder}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      const { data, error } = await supabaseAdmin
        .from("business_files")
        .insert({
          business_id: businessId,
          name: file.name,
          file_name: safeName,
          file_url: publicUrlData.publicUrl,
          file_type: file.type || "application/octet-stream",
          folder,
          size_bytes: file.size,
          metadata: {
            bucket: BUCKET,
            path: filePath,
            favorite: false,
            uploadedFrom: "files_api",
            uploadedAt: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      uploadedFiles.push(cleanFile(data));
    }

    await trackFileEvent({
      businessId,
      event: "files_uploaded",
      metadata: {
        count: uploadedFiles.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        files: uploadedFiles,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Files POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to upload files."),
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as FilePatchBody;

    const id = cleanString(body.id);

    if (!id) {
      return NextResponse.json(
        { success: false, error: "File ID is required." },
        { status: 400 }
      );
    }

    const { data: existingFile, error: loadError } = await supabaseAdmin
      .from("business_files")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    if (!existingFile) {
      return NextResponse.json(
        { success: false, error: "File not found." },
        { status: 404 }
      );
    }

    const existingMetadata =
      typeof existingFile.metadata === "object" && existingFile.metadata !== null
        ? (existingFile.metadata as Record<string, unknown>)
        : {};

    const updates: Record<string, unknown> = {};

    if (body.businessId || body.business_id) {
      updates.business_id = cleanString(body.businessId || body.business_id);
    }

    if (body.name !== undefined) {
      const name = cleanString(body.name);

      if (!name) {
        return NextResponse.json(
          { success: false, error: "File name cannot be empty." },
          { status: 400 }
        );
      }

      updates.name = name;
    }

    if (body.folder !== undefined) {
      updates.folder = cleanString(body.folder) || "documents";
    }

    if (body.favorite !== undefined) {
      updates.metadata = {
        ...existingMetadata,
        favorite: Boolean(body.favorite),
        updatedAt: new Date().toISOString(),
      };
    }

    if (body.metadata !== undefined) {
      updates.metadata = {
        ...existingMetadata,
        ...(body.metadata ?? {}),
        updatedAt: new Date().toISOString(),
      };
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: "No file updates provided." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("business_files")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await trackFileEvent({
      businessId: String(data.business_id),
      event: "file_updated",
      fileId: data.id,
      metadata: {
        updatedFields: Object.keys(updates),
      },
    });

    return NextResponse.json({
      success: true,
      file: cleanFile(data),
    });
  } catch (error) {
    console.error("Files PATCH error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to update file."),
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
        { success: false, error: "File ID is required." },
        { status: 400 }
      );
    }

    const { data: file, error: loadError } = await supabaseAdmin
      .from("business_files")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (loadError) throw loadError;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File not found." },
        { status: 404 }
      );
    }

    const metadata =
      typeof file.metadata === "object" && file.metadata !== null
        ? (file.metadata as Record<string, unknown>)
        : {};

    const path = typeof metadata.path === "string" ? metadata.path : "";

    if (path) {
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET)
        .remove([path]);

      if (storageError) {
        console.error("Storage delete failed:", storageError);
      }
    }

    const { error } = await supabaseAdmin
      .from("business_files")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await trackFileEvent({
      businessId: String(file.business_id),
      event: "file_deleted",
      fileId: id,
      metadata: {
        folder: file.folder,
        fileType: file.file_type,
      },
    });

    return NextResponse.json({
      success: true,
      deletedId: id,
    });
  } catch (error) {
    console.error("Files DELETE error:", error);

    return NextResponse.json(
      {
        success: false,
        error: getErrorMessage(error, "Unable to delete file."),
      },
      { status: 500 }
    );
  }
}