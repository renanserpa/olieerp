"use client";

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

// Hook para buscar fornecedores com tratamento de erro e verificação de tabela
export const useSuppliers = () => {
  const supabase = createClient();
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se a tabela existe antes de tentar buscar dados
      const { error: tableCheckError } = await supabase
        .from('suppliers')
        .select('id')
        .limit(1)
        .single();
      
      // Se o erro for de tabela não existente, retornar mensagem específica
      if (tableCheckError && tableCheckError.code === '42P01') {
        throw new Error("A tabela 'suppliers' não existe. Execute o script SQL para criar as tabelas necessárias.");
      }
      
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setSuppliers(data || []);
    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, "Erro ao buscar fornecedores");
      setError(errorMsg);
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getSuppliers();
  }, []);

  return { suppliers, loading, error, refresh: getSuppliers };
};

// Hook para buscar clientes com tratamento de erro e verificação de tabela
export const useClients = () => {
  const supabase = createClient();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getClients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se a tabela existe antes de tentar buscar dados
      const { error: tableCheckError } = await supabase
        .from('clients')
        .select('id')
        .limit(1)
        .single();
      
      // Se o erro for de tabela não existente, retornar mensagem específica
      if (tableCheckError && tableCheckError.code === '42P01') {
        throw new Error("A tabela 'clients' não existe. Execute o script SQL para criar as tabelas necessárias.");
      }
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setClients(data || []);
    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, "Erro ao buscar clientes");
      setError(errorMsg);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getClients();
  }, []);

  return { clients, loading, error, refresh: getClients };
};

// Função para buscar clientes (versão não-hook)
export const getClients = async (query: Record<string, any> = {}) => {
  try {
    const supabase = createClient();
    
    let queryBuilder = supabase
      .from('clients')
      .select('*');
    
    // Aplicar filtros
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('.')) {
          // Filtros especiais como 'ilike.%texto%' ou 'gte.10'
          const [operator, operand] = value.split('.');
          
          switch (operator) {
            case 'ilike':
              queryBuilder = queryBuilder.ilike(key, operand);
              break;
            case 'eq':
              queryBuilder = queryBuilder.eq(key, operand);
              break;
            case 'neq':
              queryBuilder = queryBuilder.neq(key, operand);
              break;
            case 'gt':
              queryBuilder = queryBuilder.gt(key, operand);
              break;
            case 'gte':
              queryBuilder = queryBuilder.gte(key, operand);
              break;
            case 'lt':
              queryBuilder = queryBuilder.lt(key, operand);
              break;
            case 'lte':
              queryBuilder = queryBuilder.lte(key, operand);
              break;
            default:
              queryBuilder = queryBuilder.eq(key, value);
          }
        } else {
          // Filtro simples de igualdade
          queryBuilder = queryBuilder.eq(key, value);
        }
      }
    });
    
    // Ordenar por nome
    queryBuilder = queryBuilder.order('name');
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (err: any) {
    const errorMsg = handleSupabaseError(err, "Erro ao buscar clientes");
    return { success: false, error: errorMsg, data: [] };
  }
};

// Função para buscar fornecedores (versão não-hook)
export const getSuppliers = async (query: Record<string, any> = {}) => {
  try {
    const supabase = createClient();
    
    let queryBuilder = supabase
      .from('suppliers')
      .select('*');
    
    // Aplicar filtros
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('.')) {
          // Filtros especiais como 'ilike.%texto%' ou 'gte.10'
          const [operator, operand] = value.split('.');
          
          switch (operator) {
            case 'ilike':
              queryBuilder = queryBuilder.ilike(key, operand);
              break;
            case 'eq':
              queryBuilder = queryBuilder.eq(key, operand);
              break;
            case 'neq':
              queryBuilder = queryBuilder.neq(key, operand);
              break;
            case 'gt':
              queryBuilder = queryBuilder.gt(key, operand);
              break;
            case 'gte':
              queryBuilder = queryBuilder.gte(key, operand);
              break;
            case 'lt':
              queryBuilder = queryBuilder.lt(key, operand);
              break;
            case 'lte':
              queryBuilder = queryBuilder.lte(key, operand);
              break;
            default:
              queryBuilder = queryBuilder.eq(key, value);
          }
        } else {
          // Filtro simples de igualdade
          queryBuilder = queryBuilder.eq(key, value);
        }
      }
    });
    
    // Ordenar por nome
    queryBuilder = queryBuilder.order('name');
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (err: any) {
    const errorMsg = handleSupabaseError(err, "Erro ao buscar fornecedores");
    return { success: false, error: errorMsg, data: [] };
  }
};

// Hook para buscar produtos com tratamento de erro e verificação de tabela
export const useProducts = () => {
  const supabase = createClient();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se a tabela existe antes de tentar buscar dados
      const { error: tableCheckError } = await supabase
        .from('products')
        .select('id')
        .limit(1)
        .single();
      
      // Se o erro for de tabela não existente, retornar mensagem específica
      if (tableCheckError && tableCheckError.code === '42P01') {
        throw new Error("A tabela 'products' não existe. Execute o script SQL para criar as tabelas necessárias.");
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setProducts(data || []);
    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, "Erro ao buscar produtos");
      setError(errorMsg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProducts();
  }, []);

  return { products, loading, error, refresh: getProducts };
};

// Hook genérico para buscar dados de qualquer tabela com verificação de existência
export const useSupabaseData = (tableName: string, orderBy: string = 'created_at', options: any = {}) => {
  const supabase = createClient();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { select = '*', filters = [], limit = 1000 } = options;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verificar se a tabela existe antes de tentar buscar dados
      const { error: tableCheckError } = await supabase
        .from(tableName)
        .select('id')
        .limit(1)
        .single();
      
      // Se o erro for de tabela não existente, retornar mensagem específica
      if (tableCheckError && tableCheckError.code === '42P01') {
        throw new Error(`A tabela '${tableName}' não existe. Execute o script SQL para criar as tabelas necessárias.`);
      }
      
      let query = supabase
        .from(tableName)
        .select(select)
        .order(orderBy, { ascending: false })
        .limit(limit);
      
      // Aplicar filtros se existirem
      filters.forEach((filter: any) => {
        if (filter.column && filter.operator && filter.value !== undefined) {
          query = query.filter(filter.column, filter.operator, filter.value);
        }
      });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      setData(data || []);
    } catch (err: any) {
      const errorMsg = handleSupabaseError(err, `Erro ao buscar dados da tabela ${tableName}`);
      setError(errorMsg);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName, JSON.stringify(options)]);

  return { data, loading, error, refresh: fetchData };
};

// Função para criar um novo registro em qualquer tabela com verificação de existência
export const createRecord = async (tableName: string, data: any) => {
  try {
    const supabase = createClient();
    
    // Verificar se a tabela existe antes de tentar inserir dados
    const { error: tableCheckError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // Se o erro for de tabela não existente, retornar mensagem específica
    if (tableCheckError && tableCheckError.code === '42P01') {
      throw new Error(`A tabela '${tableName}' não existe. Execute o script SQL para criar as tabelas necessárias.`);
    }
    
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) {
      throw error;
    }
    
    toast.success(`Registro criado com sucesso`);
    return { success: true, data: result };
  } catch (err: any) {
    handleSupabaseError(err, `Erro ao criar registro na tabela ${tableName}`);
    return { success: false, error: err };
  }
};

// Função para atualizar um registro em qualquer tabela com verificação de existência
export const updateRecord = async (tableName: string, id: string, data: any) => {
  try {
    const supabase = createClient();
    
    // Verificar se a tabela existe antes de tentar atualizar dados
    const { error: tableCheckError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // Se o erro for de tabela não existente, retornar mensagem específica
    if (tableCheckError && tableCheckError.code === '42P01') {
      throw new Error(`A tabela '${tableName}' não existe. Execute o script SQL para criar as tabelas necessárias.`);
    }
    
    const { data: result, error } = await supabase
      .from(tableName)
      .update(data)
      .eq('id', id)
      .select();
    
    if (error) {
      throw error;
    }
    
    toast.success(`Registro atualizado com sucesso`);
    return { success: true, data: result };
  } catch (err: any) {
    handleSupabaseError(err, `Erro ao atualizar registro na tabela ${tableName}`);
    return { success: false, error: err };
  }
};

// Função para excluir um registro em qualquer tabela com verificação de existência
export const deleteRecord = async (tableName: string, id: string) => {
  try {
    const supabase = createClient();
    
    // Verificar se a tabela existe antes de tentar excluir dados
    const { error: tableCheckError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // Se o erro for de tabela não existente, retornar mensagem específica
    if (tableCheckError && tableCheckError.code === '42P01') {
      throw new Error(`A tabela '${tableName}' não existe. Execute o script SQL para criar as tabelas necessárias.`);
    }
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);
    
    if (error) {
      throw error;
    }
    
    toast.success(`Registro excluído com sucesso`);
    return { success: true };
  } catch (err: any) {
    handleSupabaseError(err, `Erro ao excluir registro da tabela ${tableName}`);
    return { success: false, error: err };
  }
};

// Função para buscar um registro específico por ID com verificação de existência
export const getRecordById = async (tableName: string, id: string, select: string = '*') => {
  try {
    const supabase = createClient();
    
    // Verificar se a tabela existe antes de tentar buscar dados
    const { error: tableCheckError } = await supabase
      .from(tableName)
      .select('id')
      .limit(1);
    
    // Se o erro for de tabela não existente, retornar mensagem específica
    if (tableCheckError && tableCheckError.code === '42P01') {
      throw new Error(`A tabela '${tableName}' não existe. Execute o script SQL para criar as tabelas necessárias.`);
    }
    
    const { data, error } = await supabase
      .from(tableName)
      .select(select)
      .eq('id', id)
      .single();
    
    if (error) {
      throw error;
    }
    
    return { success: true, data };
  } catch (err: any) {
    handleSupabaseError(err, `Erro ao buscar registro na tabela ${tableName}`);
    return { success: false, error: err, data: null };
  }
};
