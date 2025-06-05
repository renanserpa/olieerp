"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Função para criar cliente Supabase para componentes do lado do cliente
export const createClient = () => {
  return createClientComponentClient();
};
