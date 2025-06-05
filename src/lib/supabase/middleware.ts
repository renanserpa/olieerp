import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export async function createSupabaseMiddlewareClient(req: NextRequest) {
  // Cria uma resposta inicial
  const response = NextResponse.next();
  
  // Definindo as credenciais diretamente no código para o contexto Edge
  // Isso é necessário porque variáveis de ambiente NEXT_PUBLIC_ podem não estar 
  // disponíveis no contexto Edge Runtime do Next.js
  const supabaseUrl = "https://lhnfftajaanimavszbnf.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxobmZmdGFqYWFuaW1hdnN6Ym5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTEyODMsImV4cCI6MjA2Mjg4NzI4M30.lJRjKPPzLNwRByFfa_XmtM20IPKqcn-4dddgNbuOUzU";

  // Cria o cliente Supabase usando createServerClient em vez de createMiddlewareClient
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove: (name, options) => {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  return { supabase, response };
}
