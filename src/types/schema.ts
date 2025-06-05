// Definições de tipos para o schema do banco de dados
// Alinhados com as tabelas reais do Supabase

export interface Client {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  document?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  contact_name?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockItem {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  barcode?: string | null;
  quantity: number;
  min_quantity?: number | null;
  max_quantity?: number | null;
  unit_cost?: number | null;
  location_id?: string | null;
  group_id?: string | null;
  unit_of_measurement_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  location?: {
    id: string;
    name: string;
  } | null;
  group?: {
    id: string;
    name: string;
  } | null;
  unit_of_measurement?: {
    id: string;
    name: string;
    abbreviation: string;
  } | null;
}

export interface Component {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  category_id?: string | null;
  unit_of_measurement_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  category?: {
    id: string;
    name: string;
  } | null;
  unit_of_measurement?: {
    id: string;
    name: string;
    abbreviation: string;
  } | null;
}

export interface Supply {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  quantity: number;
  min_quantity?: number | null;
  max_quantity?: number | null;
  unit_cost?: number | null;
  supplier_id?: string | null;
  unit_of_measurement_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  supplier?: {
    id: string;
    name: string;
  } | null;
  unit_of_measurement?: {
    id: string;
    name: string;
    abbreviation: string;
  } | null;
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku?: string | null;
  price?: number | null;
  cost?: number | null;
  category_id?: string | null;
  division_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  category?: {
    id: string;
    name: string;
  } | null;
  division?: {
    id: string;
    name: string;
  } | null;
  product_categories?: Array<{
    id: string;
    name: string;
  }>;
}

export interface Order {
  id: string;
  order_number: string;
  client_id: string;
  total_amount: number;
  status_id: string;
  notes?: string | null;
  delivery_date?: string | null;
  division_id?: string | null;
  production_order_requested: boolean;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  client?: {
    id: string;
    name: string;
  };
  status?: {
    id: string;
    name: string;
  };
  division?: {
    id: string;
    name: string;
  } | null;
  order_items?: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    product?: {
      id: string;
      name: string;
    };
  }>;
}

export interface ProductionOrder {
  id: string;
  order_id: string;
  status_id: string;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  order?: {
    id: string;
    order_number: string;
    client?: {
      id: string;
      name: string;
    };
  };
  status?: {
    id: string;
    name: string;
  };
  global_statuses?: Array<{
    id: string;
    name: string;
  }>;
}

export interface PurchaseRequest {
  id: string;
  supplier_id: string;
  status_id: string;
  total_amount: number;
  notes?: string | null;
  expected_delivery_date?: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  supplier?: {
    id: string;
    name: string;
  };
  status?: {
    id: string;
    name: string;
  };
}

export interface DeliveryRoute {
  id: string;
  name: string;
  description?: string | null;
  date: string;
  status_id: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  status?: {
    id: string;
    name: string;
  };
  deliveries?: Array<{
    id: string;
    order_id: string;
    order?: {
      id: string;
      order_number: string;
      client?: {
        id: string;
        name: string;
      };
    };
  }>;
}

export interface StockMovement {
  id: string;
  stock_item_id: string;
  quantity: number;
  movement_type: 'entrada' | 'saida';
  reference_id?: string | null;
  reference_type?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  stock_item?: {
    id: string;
    name: string;
  };
}

export interface FinancialTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string | null;
  description?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  division_id?: string | null;
  created_at: string;
  updated_at: string;
  // Relacionamentos
  category?: {
    id: string;
    name: string;
  } | null;
  division?: {
    id: string;
    name: string;
  } | null;
}

export interface Division {
  id: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GlobalStatus {
  id: string;
  name: string;
  description?: string | null;
  type: string;
  color?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
