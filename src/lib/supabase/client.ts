"use client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Database } from "@/types/supabase";

export function createClient() {
  return createClientComponentClient<Database>();
}

export const createSupabaseClient = createClient;
