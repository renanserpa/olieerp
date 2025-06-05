-- Criação de tabelas que faltam no schema

-- Tabela de histórico de status de produção
CREATE TABLE IF NOT EXISTS production_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    status_id UUID NOT NULL REFERENCES global_statuses(id),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de etapas de produção
CREATE TABLE IF NOT EXISTS historico_etapas_producao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    production_order_id UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    etapa_id UUID NOT NULL REFERENCES etapas_producao(id),
    status_id UUID NOT NULL REFERENCES global_statuses(id),
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adição de campos obrigatórios faltantes

-- Adicionar campo order_number à tabela orders se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'orders' AND column_name = 'order_number') THEN
        ALTER TABLE orders ADD COLUMN order_number VARCHAR(50);
        
        -- Atualizar registros existentes com um número de pedido baseado no ID
        UPDATE orders SET order_number = 'ORD-' || SUBSTRING(id::text, 1, 8) WHERE order_number IS NULL;
        
        -- Tornar o campo NOT NULL após preencher os valores existentes
        ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;
    END IF;
END $$;

-- Adicionar campo production_order_requested à tabela orders se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'orders' AND column_name = 'production_order_requested') THEN
        ALTER TABLE orders ADD COLUMN production_order_requested BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Adicionar campo group_id à tabela stock_items se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stock_items' AND column_name = 'group_id') THEN
        ALTER TABLE stock_items ADD COLUMN group_id UUID REFERENCES stock_groups(id);
    END IF;
END $$;

-- Garantir que a tabela unit_of_measurement tenha todas as colunas necessárias
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'unit_of_measurement' AND column_name = 'abbreviation') THEN
        ALTER TABLE unit_of_measurement ADD COLUMN abbreviation VARCHAR(10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'unit_of_measurement' AND column_name = 'is_active') THEN
        ALTER TABLE unit_of_measurement ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Padronização de campos is_active em vez de status
DO $$
BEGIN
    -- Converter campos status (varchar) para is_active (boolean) onde necessário
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'clients' AND column_name = 'status' AND data_type = 'character varying') THEN
        ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        UPDATE clients SET is_active = (status = 'active' OR status = 'ativo');
        ALTER TABLE clients DROP COLUMN status;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'suppliers' AND column_name = 'status' AND data_type = 'character varying') THEN
        ALTER TABLE suppliers ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        UPDATE suppliers SET is_active = (status = 'active' OR status = 'ativo');
        ALTER TABLE suppliers DROP COLUMN status;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' AND column_name = 'status' AND data_type = 'character varying') THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        UPDATE products SET is_active = (status = 'active' OR status = 'ativo');
        ALTER TABLE products DROP COLUMN status;
    END IF;
END $$;

-- Garantir que todas as tabelas tenham timestamps created_at e updated_at
DO $$
DECLARE
    table_rec RECORD;
BEGIN
    FOR table_rec IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        -- Adicionar created_at se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_rec.table_name AND column_name = 'created_at') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()', table_rec.table_name);
        END IF;
        
        -- Adicionar updated_at se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_rec.table_name AND column_name = 'updated_at') THEN
            EXECUTE format('ALTER TABLE %I ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()', table_rec.table_name);
        END IF;
    END LOOP;
END $$;

-- Criar função para verificar estoque baixo
CREATE OR REPLACE FUNCTION get_field_ref(table_name text, row_id text, field_name text)
RETURNS numeric AS $$
DECLARE
    result numeric;
    query text;
BEGIN
    query := 'SELECT ' || quote_ident(field_name) || ' FROM ' || quote_ident(table_name) || 
             ' WHERE id = ' || quote_literal(row_id) || '::uuid';
    EXECUTE query INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Criar índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_division_id ON orders(division_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(type);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_production_orders_order_id ON production_orders(order_id);
