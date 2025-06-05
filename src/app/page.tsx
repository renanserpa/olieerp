"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Definir um timeout para evitar loop infinito
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 5000); // 5 segundos de timeout
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error.message);
          setError("Não foi possível verificar sua sessão. Por favor, faça login novamente.");
          router.push("/login");
          return;
        }
        
        if (data?.session) {
          // Se o usuário estiver autenticado, permanece na página principal (dashboard)
          // Não redireciona, pois esta já é a página do dashboard
          setIsLoading(false);
        } else {
          // Se não estiver autenticado, redireciona para o login
          router.push("/login");
        }
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error);
        setError("Ocorreu um erro ao verificar sua autenticação. Por favor, tente novamente.");
        router.push("/login");
      } finally {
        setIsLoading(false);
        clearTimeout(timer);
      }
    };
    
    checkSession();
    
    return () => clearTimeout(timer);
  }, [router, supabase]);
  
  // Se o timeout for atingido, mostrar botões de ação alternativa
  if (loadingTimeout) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Olie ERP</h1>
          <p className="text-muted-foreground mb-6">Parece que estamos tendo problemas para carregar o sistema.</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => router.push("/login")} 
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Ir para a página de login
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 border border-gray-300 rounded-md"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Olie ERP</h1>
          <p className="text-red-500 mb-6">{error}</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => router.push("/login")} 
              className="px-4 py-2 bg-primary text-white rounded-md"
            >
              Ir para a página de login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Olie ERP</h1>
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Dashboard principal - esta é a página que será exibida quando o usuário estiver autenticado
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard Principal</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Receita Total</h2>
          <p className="text-2xl font-bold">R$ 45.231,89</p>
          <p className="text-xs text-green-500">+12% vs mês passado</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Novos Clientes</h2>
          <p className="text-2xl font-bold">+24</p>
          <p className="text-xs text-green-500">+8% vs mês passado</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Pedidos Pendentes</h2>
          <p className="text-2xl font-bold">18</p>
          <p className="text-xs text-gray-500">Aguardando processamento</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-sm font-medium text-gray-500">Produção Ativa</h2>
          <p className="text-2xl font-bold">7</p>
          <p className="text-xs text-gray-500">Ordens em andamento</p>
        </div>
      </div>

      {/* Gráficos e Alertas */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Vendas Recentes</h2>
            <div className="h-64 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Gráfico de Vendas (Demonstração)</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Atividade Recente</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                <p className="text-sm">Novo pedido criado - Cliente: Maria Silva</p>
                <p className="text-xs text-gray-500 ml-auto">Há 2 horas</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <p className="text-sm">Produto atualizado - SKU: PROD001</p>
                <p className="text-xs text-gray-500 ml-auto">Há 3 horas</p>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                <p className="text-sm">Estoque baixo - Produto: Tecido Algodão</p>
                <p className="text-xs text-gray-500 ml-auto">Há 5 horas</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Alertas de Estoque Baixo</h2>
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="font-medium">Tecido Algodão</p>
              <p className="text-sm text-gray-600">Estoque: 5 metros (Mínimo: 20)</p>
            </div>
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="font-medium">Linha Preta</p>
              <p className="text-sm text-gray-600">Estoque: 3 rolos (Mínimo: 10)</p>
            </div>
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400">
              <p className="font-medium">Botões 15mm</p>
              <p className="text-sm text-gray-600">Estoque: 25 unidades (Mínimo: 100)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
