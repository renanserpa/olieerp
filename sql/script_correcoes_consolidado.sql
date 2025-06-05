-- Script SQL Consolidado para Correções do ERP Olie
-- Este script resolve os problemas de alinhamento entre schema e frontend

-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- CORREÇÕES DE SCHEMA - PADRONIZAÇÃO DE CAMPOS
-- ==========================================

-- 1. Garantir que todas as tabelas tenham campos is_active (boolean) consistentes
-- Isso resolve o erro "column 'status' does not exist"

-- Verificar e corrigir tabela components
DO $$
BEGIN
    -- Garantir que a coluna is_active existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'components' AND column_name = 'is_active') THEN
        ALTER TABLE components ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Se existir coluna status, migrar dados e remover
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'components' AND column_name = 'status') THEN
        UPDATE components SET is_active = (status = 'Ativo' OR status = 'ativo' OR status = 'ATIVO');
        ALTER TABLE components DROP COLUMN status;
    END IF;
END $$;

-- Verificar e corrigir tabela stock_items (insumos)
DO $$
BEGIN
    -- Garantir que a coluna is_active existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stock_items' AND column_name = 'is_active') THEN
        ALTER TABLE stock_items ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Se existir coluna status, migrar dados e remover
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'stock_items' AND column_name = 'status') THEN
        UPDATE stock_items SET is_active = (status = 'Ativo' OR status = 'ativo' OR status = 'ATIVO');
        ALTER TABLE stock_items DROP COLUMN status;
    END IF;
END $$;

-- Verificar e corrigir tabela clients
DO $$
BEGIN
    -- Garantir que a coluna is_active existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'clients' AND column_name = 'is_active') THEN
        ALTER TABLE clients ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Se existir coluna status, migrar dados e remover
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'clients' AND column_name = 'status') THEN
        UPDATE clients SET is_active = (status = 'Ativo' OR status = 'ativo' OR status = 'ATIVO');
        ALTER TABLE clients DROP COLUMN status;
    END IF;
END $$;

-- Verificar e corrigir tabela products
DO $$
BEGIN
    -- Garantir que a coluna is_active existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'products' AND column_name = 'is_active') THEN
        ALTER TABLE products ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Se existir coluna status, migrar dados e remover
    IF EXISTS (SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'products' AND column_name = 'status') THEN
        UPDATE products SET is_active = (status = 'Ativo' OR status = 'ativo' OR status = 'ATIVO');
        ALTER TABLE products DROP COLUMN status;
    END IF;
END $$;

-- NOTA: Para a tabela suppliers, mantemos ambos os campos (status e is_active)
-- pois status representa o estado do fornecedor (Ativo, Bloqueado, etc.)
-- e is_active representa se o registro está ativo no sistema
DO $$
BEGIN
    -- Garantir que a coluna is_active existe na tabela suppliers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'suppliers' AND column_name = 'is_active') THEN
        ALTER TABLE suppliers ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Se já existe status, sincronizar is_active com status
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'suppliers' AND column_name = 'status') THEN
            UPDATE suppliers SET is_active = (status = 'Ativo' OR status = 'ativo' OR status = 'ATIVO');
        END IF;
    END IF;
END $$;

-- ==========================================
-- CRIAÇÃO DE ÍNDICES PARA PERFORMANCE
-- ==========================================

-- Índices para melhorar performance de consultas com is_active
CREATE INDEX IF NOT EXISTS idx_components_is_active ON public.components(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_items_is_active ON public.stock_items(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_is_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);

-- Índices para campos de busca frequente
CREATE INDEX IF NOT EXISTS idx_components_name ON public.components(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_name ON public.stock_items(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_sku ON public.stock_items(sku);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_document ON public.clients(document);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);

-- ==========================================
-- FUNÇÕES AUXILIARES
-- ==========================================

-- Função para verificar estoque baixo
CREATE OR REPLACE FUNCTION check_low_stock()
RETURNS TABLE(
    id UUID,
    name VARCHAR,
    current_quantity NUMERIC,
    min_quantity NUMERIC,
    difference NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        si.id,
        si.name,
        si.quantity as current_quantity,
        si.min_quantity,
        (si.min_quantity - si.quantity) as difference
    FROM stock_items si
    WHERE si.is_active = true 
    AND si.quantity < si.min_quantity
    ORDER BY difference DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar timestamp de updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA
-- ==========================================

-- Triggers para atualizar updated_at automaticamente
DO $$
BEGIN
    -- Components
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_components_updated_at') THEN
        CREATE TRIGGER update_components_updated_at
            BEFORE UPDATE ON components
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Stock Items
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_stock_items_updated_at') THEN
        CREATE TRIGGER update_stock_items_updated_at
            BEFORE UPDATE ON stock_items
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Clients
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_clients_updated_at') THEN
        CREATE TRIGGER update_clients_updated_at
            BEFORE UPDATE ON clients
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Products
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_products_updated_at') THEN
        CREATE TRIGGER update_products_updated_at
            BEFORE UPDATE ON products
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Suppliers
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_suppliers_updated_at') THEN
        CREATE TRIGGER update_suppliers_updated_at
            BEFORE UPDATE ON suppliers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ==========================================
-- VALIDAÇÕES E VERIFICAÇÕES
-- ==========================================

-- Verificar se todas as correções foram aplicadas
DO $$
DECLARE
    missing_columns TEXT := '';
BEGIN
    -- Verificar se todas as tabelas têm is_active
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'components' AND column_name = 'is_active') THEN
        missing_columns := missing_columns || 'components.is_active ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'is_active') THEN
        missing_columns := missing_columns || 'stock_items.is_active ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'is_active') THEN
        missing_columns := missing_columns || 'clients.is_active ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_active') THEN
        missing_columns := missing_columns || 'products.is_active ';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'is_active') THEN
        missing_columns := missing_columns || 'suppliers.is_active ';
    END IF;
    
    IF missing_columns != '' THEN
        RAISE NOTICE 'ATENÇÃO: As seguintes colunas ainda estão faltando: %', missing_columns;
    ELSE
        RAISE NOTICE 'SUCESSO: Todas as correções de schema foram aplicadas com sucesso!';
    END IF;
END $$;

-- ==========================================
-- COMENTÁRIOS FINAIS
-- ==========================================

COMMENT ON FUNCTION check_low_stock() IS 'Função para verificar itens com estoque abaixo do mínimo';
COMMENT ON FUNCTION update_updated_at_column() IS 'Função para atualizar automaticamente o campo updated_at';

-- Inserir log de execução
INSERT INTO public.system_logs (message, level, created_at) 
VALUES ('Script de correções de schema executado com sucesso', 'INFO', NOW())
ON CONFLICT DO NOTHING;

