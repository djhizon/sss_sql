import { supabase } from "@/integrations/supabase/client";
import { applicationInputSchema, type ApplicationInput } from "./applications.schema";
import { z } from "zod";

function cleanOptional<T extends Record<string, unknown>>(obj: T) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = v === "" ? null : v;
  }
  return out;
}

export async function submitApplication({ data }: { data: ApplicationInput }) {
  const validated = applicationInputSchema.parse(data);
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Unauthorized");

  const payload = { ...cleanOptional(validated), user_id: userData.user.id };
  const { data: row, error } = await supabase
    .from("applications")
    .insert(payload as never)
    .select("app_number")
    .single();
  if (error) throw new Error(error.message);
  return { app_number: row.app_number as number };
}

export async function listMyApplications() {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from("applications")
    .select("app_number, applicant_name, status, created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getApplication({ data: { id } }: { data: { id: number } }) {
  z.object({ id: z.number().int() }).parse({ id });
  
  const { data: row, error } = await supabase
    .from("applications")
    .select("*")
    .eq("app_number", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Application not found");
  return row;
}

export async function checkIsAdmin() {
  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData.user) return { isAdmin: false };
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return { isAdmin: false };
  return { isAdmin: !!data };
}

export async function adminListApplications({ data }: { data: { status?: "pending" | "approved" | "rejected" | "all" } }) {
  z.object({ status: z.enum(["pending", "approved", "rejected", "all"]).optional() }).parse(data);
  
  let q = supabase
    .from("applications")
    .select("app_number, applicant_name, ap_ss_num, status, created_at, user_id")
    .order("created_at", { ascending: false });
  if (data.status && data.status !== "all") q = q.eq("status", data.status);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return rows ?? [];
}

export async function adminDecide({ data }: { data: { id: number; decision: "approved" | "rejected"; notes?: string } }) {
  z.object({
      id: z.number().int(),
      decision: z.enum(["approved", "rejected"]),
      notes: z.string().max(1000).optional(),
    }).parse(data);

  const { data: userData, error: authErr } = await supabase.auth.getUser();
  if (authErr || !userData.user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("applications")
    .update({
      status: data.decision,
      decided_by: userData.user.id,
      decided_at: new Date().toISOString(),
      decision_notes: data.notes ?? null,
    } as never)
    .eq("app_number", data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
