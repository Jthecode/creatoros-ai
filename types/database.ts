export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlanKey = "free" | "pro" | "business" | "elite";

export type BusinessStatus = "draft" | "active" | "paused";

export type ProductType =
  | "digital"
  | "service"
  | "membership"
  | "course"
  | "event"
  | "subscription";

export type ProductStatus = "draft" | "active" | "archived";

export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "refunded"
  | "cancelled";

export type AIAgentRole =
  | "sales_manager"
  | "support_agent"
  | "marketing_manager"
  | "business_coach";

export type GeneratedProduct = {
  name: string;
  price: string;
  description: string;
};

export type GeneratedFAQ = {
  question: string;
  answer: string;
};

export type GeneratedBusiness = {
  businessName: string;
  tagline: string;
  industry: string;
  audience: string;
  description: string;
  brandVoice: string;
  storefrontHeadline: string;
  storefrontSubheadline: string;
  products: GeneratedProduct[];
  faq: GeneratedFAQ[];
  aiEmployee: {
    name: string;
    role: string;
    openingMessage: string;
    instructions: string;
  };
  checklist: string[];
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: PlanKey;
  created_at: string;
};

export type Business = {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  industry: string | null;
  description: string | null;
  tagline: string | null;
  audience: string | null;
  brand_voice: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  generated_data: Json | null;
  status: BusinessStatus;
  created_at: string;
};

export type Product = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  type: ProductType;
  status: ProductStatus;
  created_at: string;
};

export type Order = {
  id: string;
  business_id: string;
  customer_email: string;
  total_cents: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
};

export type AIAgent = {
  id: string;
  business_id: string;
  name: string;
  role: AIAgentRole;
  opening_message: string | null;
  instructions: string | null;
  is_active: boolean;
  created_at: string;
};