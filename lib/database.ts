import { supabase } from "./supabase";
import type {
  Business,
  Product,
  Profile,
  AIAgent,
  Order,
} from "@/types/database";

/* =====================================================
   PROFILE
===================================================== */

export async function getCurrentUser() {
  return supabase.auth.getUser();
}

export async function getCurrentSession() {
  return supabase.auth.getSession();
}

/* =====================================================
   BUSINESSES
===================================================== */

export async function getBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Business[];
}

export async function getBusiness(id: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Business;
}

export async function createBusiness(
  business: Partial<Business>
) {
  const { data, error } = await supabase
    .from("businesses")
    .insert(business)
    .select()
    .single();

  if (error) throw error;

  return data as Business;
}

export async function updateBusiness(
  id: string,
  updates: Partial<Business>
) {
  const { data, error } = await supabase
    .from("businesses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Business;
}

export async function deleteBusiness(id: string) {
  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/* =====================================================
   PRODUCTS
===================================================== */

export async function getProducts(businessId: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Product[];
}

export async function createProduct(
  product: Partial<Product>
) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;

  return data as Product;
}

/* =====================================================
   AI EMPLOYEES
===================================================== */

export async function getAIAgents(
  businessId: string
) {
  const { data, error } = await supabase
    .from("ai_agents")
    .select("*")
    .eq("business_id", businessId);

  if (error) throw error;

  return data as AIAgent[];
}

/* =====================================================
   ORDERS
===================================================== */

export async function getOrders(
  businessId: string
) {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Order[];
}

/* =====================================================
   PROFILE
===================================================== */

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", userId)
    .single();

  if (error) throw error;

  return data as Profile;
}