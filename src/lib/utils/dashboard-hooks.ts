"use client";

import React from 'react';
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

// Função utilitária para lidar com erros do Supabase
export const handleSupabaseError = (error: any, defaultMessage: string = "Ocorreu um erro na operação") => {
  console.error("Erro Supabase:", error);
  const errorMessage = error?.message || defaultMessage;
  toast.error(errorMessage);
  return errorMessage;
};

// Hook para buscar dados do dashboard com tratamento de erro e verificação de tabela
export const useDashboardData = () => {
  const supabase = createClient();
  const [dashboardData, setDashboardData] = useState({
    totalRevenue: 0,
    newClients: 0,
    pendingOrders: 0,
    activeProduction: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se a tabela orders existe antes de tentar buscar dados
      const { error: tableCheckError } = await supabase
        .from('orders')
        .select('id')
        .limit(1)
        .single();
      
      // Se o erro for de tabela não existente, usar dados mockados
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log("Tabela 'orders' não existe. Usando dados mockados.");
        
        // Dados mockados para demonstração
        setDashboardData({
          totalRevenue: 15750.00,
          newClients: 12,
          pendingOrders: 8,
          activeProduction: 5
        });
        
        return;
      }
      
      // Se a tabela existir, buscar dados reais (implementação futura)
      // Por enquanto, usar dados mockados mesmo se as tabelas existirem
      setDashboardData({
        totalRevenue: 15750.00,
        newClients: 12,
        pendingOrders: 8,
        activeProduction: 5
      });
      
    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, "Erro ao buscar dados do dashboard");
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return { dashboardData, loading, error, refresh: fetchDashboardData };
};

// Hook para buscar alertas de estoque baixo
export const useLowStockAlerts = () => {
  const supabase = createClient();
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLowStockAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se a tabela stock_items existe antes de tentar buscar dados
      const { error: tableCheckError } = await supabase
        .from('stock_items')
        .select('id')
        .limit(1)
        .single();
      
      // Se o erro for de tabela não existente, usar dados mockados
      if (tableCheckError && tableCheckError.code === '42P01') {
        console.log("Tabela 'stock_items' não existe. Usando dados mockados.");
        
        // Dados mockados para demonstração
        setLowStockItems([
          { id: 'uuid-item-1', name: 'Tecido Algodão', current_quantity: 15, min_quantity: 20, unit_of_measure: 'm' },
          { id: 'uuid-item-2', name: 'Componente Y', current_quantity: 25, min_quantity: 30, unit_of_measure: 'un' },
          { id: 'uuid-item-3', name: 'Material Z Crítico', current_quantity: 5, min_quantity: 10, unit_of_measure: 'm' }
        ]);
        
        return;
      }
      
      // Se a tabela existir, buscar dados reais
      const { data, error } = await supabase
        .from('stock_items')
        .select('id, name, current_quantity, min_quantity, unit_of_measure')
        .lte('current_quantity', supabase.sql('min_quantity')) // Filter where current <= min
        .not('min_quantity', 'is', null) // Ensure min_quantity is set
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setLowStockItems(data || []);
      
    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, "Erro ao buscar alertas de estoque baixo");
      setError(errorMsg);
      // Usar dados mockados em caso de erro
      setLowStockItems([
        { id: 'uuid-item-1', name: 'Tecido Algodão', current_quantity: 15, min_quantity: 20, unit_of_measure: 'm' },
        { id: 'uuid-item-2', name: 'Componente Y', current_quantity: 25, min_quantity: 30, unit_of_measure: 'un' },
        { id: 'uuid-item-3', name: 'Material Z Crítico', current_quantity: 5, min_quantity: 10, unit_of_measure: 'm' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLowStockAlerts();
  }, []);

  return { lowStockItems, loading, error, refresh: fetchLowStockAlerts };
};
