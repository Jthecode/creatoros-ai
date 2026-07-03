import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import CommandCenterClient from "./client";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{
    businessId?: string;
  }>;
};

type Business = {
  id: string;
  name: string;
  description: string | null;
  industry: string |null;
  audience: string | null;
};

async function loadCommandCenter(businessId: string) {
  const [businessResult, historyResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id,name,description,industry,audience")
      .eq("id", businessId)
      .single(),

    supabaseAdmin
      .from("command_runs")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", {
        ascending: false,
      })
      .limit(25),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (historyResult.error) {
    throw historyResult.error;
  }

  return {
    business: businessResult.data as Business,
    history: historyResult.data ?? [],
  };
}

export default async function CommandCenterPage({
  searchParams,
}: Props) {
  const params = await searchParams;

  const businessId = params.businessId;

  if (!businessId) {
    notFound();
  }

  const data = await loadCommandCenter(businessId);

  if (!data) {
    notFound();
  }

  return (
    <CommandCenterClient
      business={data.business}
      history={data.history}
    />
  );
}