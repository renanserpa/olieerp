// Arquivo de utilidades para integração com o Supabase
// Este arquivo contém funções para interagir com o banco de dados Supabase
// alinhadas com o schema real do banco

import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { 
  Client, Supplier, StockItem, Component, Supply, 
  Product, Order, ProductionOrder, PurchaseRequest,
  DeliveryRoute, StockMovement
} from '@/types/schema';

// Função genérica para tratar erros do Supabase
export const handleSupabaseError = (error: any) => {
  console.error('Erro Supabase:', error);
  
  // Mensagens de erro específicas baseadas no código de erro
  const errorMessages: Record<string, string> = {
    '42703': 'Coluna não existe no banco de dados. Verifique o schema.',
    '23505': 'Registro duplicado. Este item já existe no banco de dados.',
    '23503': 'Violação de chave estrangeira. Verifique se os registros relacionados existem.',
    '42P01': 'Tabela não existe no banco de dados. Verifique o schema.',
  };

  // Extrair código de erro se disponível
  const pgError = error?.code || '';
  const message = errorMessages[pgError] || 'Erro ao acessar o banco de dados.';
  
  toast.error(message);
  return { success: false, error: message };
};

// Função para criar um novo registro
export const createRecord = async <T extends Record<string, any>>(
  table: string, 
  data: Partial<T>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const supabase = createClient();
    
    // Remover campos undefined ou null para evitar erros de tipo
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const { data: result, error } = await supabase
      .from(table)
      .insert(cleanData)
      .select()
      .single();
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data: result as T };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Função para atualizar um registro existente
export const updateRecord = async <T extends Record<string, any>>(
  table: string, 
  id: string, 
  data: Partial<T>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const supabase = createClient();
    
    // Remover campos undefined ou null para evitar erros de tipo
    const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    // Adicionar updated_at automaticamente
    cleanData.updated_at = new Date().toISOString();
    
    const { data: result, error } = await supabase
      .from(table)
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data: result as T };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Função para excluir um registro
export const deleteRecord = async (
  table: string, 
  id: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Função para buscar um registro por ID
export const getRecordById = async <T extends Record<string, any>>(
  table: string, 
  id: string
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data: data as T };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Função para buscar registros com filtros
export const getRecords = async <T extends Record<string, any>>(
  table: string, 
  query: Record<string, any> = {}
): Promise<{ success: boolean; data?: T[]; error?: string }> => {
  try {
    const supabase = createClient();
    
    let queryBuilder = supabase.from(table).select('*');
    
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
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data: data as T[] };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

// Funções específicas para cada entidade
export const getClients = async (query: Record<string, any> = {}) => {
  return getRecords<Client>('clients', query);
};

export const getClientById = async (id: string) => {
  return getRecordById<Client>('clients', id);
};

// Renomeado para evitar conflito com createClient do Supabase
export const createClientRecord = async (data: Partial<Client>) => {
  return createRecord<Client>('clients', data);
};

export const updateClient = async (id: string, data: Partial<Client>) => {
  return updateRecord<Client>('clients', id, data);
};

export const deleteClient = async (id: string) => {
  return deleteRecord('clients', id);
};

export const getSuppliers = async (query: Record<string, any> = {}) => {
  return getRecords<Supplier>('suppliers', query);
};

export const getSupplierById = async (id: string) => {
  return getRecordById<Supplier>('suppliers', id);
};

export const createSupplier = async (data: Partial<Supplier>) => {
  return createRecord<Supplier>('suppliers', data);
};

export const updateSupplier = async (id: string, data: Partial<Supplier>) => {
  return updateRecord<Supplier>('suppliers', id, data);
};

export const deleteSupplier = async (id: string) => {
  return deleteRecord('suppliers', id);
};

export const getStockItems = async (query: Record<string, any> = {}) => {
  // Tratamento especial para o filtro de estoque baixo
  if (query.low_stock) {
    delete query.low_stock;
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('stock_items')
        .select('*, group:group_id(*), location:location_id(*), unit_of_measurement:unit_of_measurement_id(*)')
        .lt('quantity', supabase.rpc('get_field_ref', { table_name: 'stock_items', row_id: 'id', field_name: 'min_quantity' }));
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      return { success: true, data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
  
  // Consulta padrão com joins para obter dados relacionados
  try {
    const supabase = createClient();
    
    let queryBuilder = supabase
      .from('stock_items')
      .select('*, group:group_id(*), location:location_id(*), unit_of_measurement:unit_of_measurement_id(*)');
    
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
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const getStockItemById = async (id: string) => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('stock_items')
      .select('*, group:group_id(*), location:location_id(*), unit_of_measurement:unit_of_measurement_id(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const createStockItem = async (data: Partial<StockItem>) => {
  return createRecord<StockItem>('stock_items', data);
};

export const updateStockItem = async (id: string, data: Partial<StockItem>) => {
  return updateRecord<StockItem>('stock_items', id, data);
};

export const deleteStockItem = async (id: string) => {
  return deleteRecord('stock_items', id);
};

export const getComponents = async (query: Record<string, any> = {}) => {
  try {
    const supabase = createClient();
    
    let queryBuilder = supabase
      .from('components')
      .select('*, category:category_id(*), unit_of_measurement:unit_of_measurement_id(*)');
    
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
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const getComponentById = async (id: string) => {
  try {
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('components')
      .select('*, category:category_id(*), unit_of_measurement:unit_of_measurement_id(*)')
      .eq('id', id)
      .single();
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};

export const createComponent = async (data: Partial<Component>) => {
  return createRecord<Component>('components', data);
};

export const updateComponent = async (id: string, data: Partial<Component>) => {
  return updateRecord<Component>('components', id, data);
};

export const deleteComponent = async (id: string) => {
  return deleteRecord('components', id);
};

export const getSupplies = async (query: Record<string, any> = {}) => {
  // Tratamento especial para o filtro de estoque baixo
  if (query.low_stock) {
    delete query.low_stock;
    
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('supplies')
        .select('*, supplier:supplier_id(*), unit_of_measurement:unit_of_measurement_id(*)')
        .lt('quantity', supabase.rpc('get_field_ref', { table_name: 'supplies', row_id: 'id', field_name: 'min_quantity' }));
      
      if (error) {
        return handleSupabaseError(error);
      }
      
      return { success: true, data };
    } catch (error) {
      return handleSupabaseError(error);
    }
  }
  
  // Consulta padrão com joins para obter dados relacionados
  try {
    const supabase = createClient();
    
    let queryBuilder = supabase
      .from('supplies')
      .select('*, supplier:supplier_id(*), unit_of_measurement:unit_of_measurement_id(*)');
    
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
    
    const { data, error } = await queryBuilder;
    
    if (error) {
      return handleSupabaseError(error);
    }
    
    return { success: true, data };
  } catch (error) {
    return handleSupabaseError(error);
  }
};
