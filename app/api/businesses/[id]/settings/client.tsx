"use client";

import BusinessSettingsForm from "@/components/BusinessSettingsForm";

type Business = {
  id: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  status: string | null;
};

type Props = {
  business: Business;
};

export default function BusinessSettingsClient({ business }: Props) {
  return <BusinessSettingsForm business={business} />;
}