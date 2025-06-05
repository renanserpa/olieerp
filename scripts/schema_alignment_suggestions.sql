-- Script SQL para ajustes e alinhamento do schema do banco de dados
-- Este script contém sugestões de ajustes no schema para garantir compatibilidade total com o frontend

-- 1. Garantir que todas as tabelas tenham campos is_active (boolean) em vez de status (varchar)
-- Isso padroniza o tratamento de status em todo o sistema

-- Verificar se a coluna is_active existe na tabela suppliers, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'suppliers' AND column_name = 'is_active') THEN
        ALTER TABLE suppliers ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Se existir coluna status, migrar dados
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'suppliers' AND column_name = 'status') THEN
            UPDATE suppliers SET is_active = (status = 'Ativo' OR status = 'ativo');
            ALTER TABLE suppliers DROP COLUMN status;
        END IF;
    END IF;
END $$;

-- Verificar se a coluna is_active existe na tabela components, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'components' AND column_name = 'is_active') THEN
        ALTER TABLE components ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Se existir coluna status, migrar dados
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'components' AND column_name = 'status') THEN
            UPDATE components SET is_active = (status = 'Ativo' OR status = 'ativo');
            ALTER TABLE components DROP COLUMN status;
        END IF;
    END IF;
END $$;

-- Verificar se a coluna is_active existe na tabela supplies, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'supplies' AND column_name = 'is_active') THEN
        ALTER TABLE supplies ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Se existir coluna status, migrar dados
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'supplies' AND column_name = 'status') THEN
            UPDATE supplies SET is_active = (status = 'Ativo' OR status = 'ativo');
            ALTER TABLE supplies DROP COLUMN status;
        END IF;
    END IF;
END $$;

-- 2. Garantir que a tabela unit_of_measurement tenha todas as colunas necessárias
DO $$
BEGIN
    -- Verificar se a tabela existe, se não, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_name = 'unit_of_measurement') THEN
        CREATE TABLE unit_of_measurement (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            symbol VARCHAR(10) NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Inserir unidades de medida padrão
        INSERT INTO unit_of_measurement (name, symbol, description)
        VALUES 
            ('Unidade', 'un', 'Unidade individual'),
            ('Quilograma', 'kg', 'Medida de peso'),
            ('Metro', 'm', 'Medida de comprimento'),
            ('Litro', 'L', 'Medida de volume'),
            ('Caixa', 'cx', 'Caixa com múltiplas unidades'),
            ('Pacote', 'pct', 'Pacote com múltiplas unidades');
    ELSE
        -- Verificar se a coluna symbol existe, se não, criar
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'unit_of_measurement' AND column_name = 'symbol') THEN
            ALTER TABLE unit_of_measurement ADD COLUMN symbol VARCHAR(10);
            
            -- Preencher valores padrão para symbol baseado no nome
            UPDATE unit_of_measurement SET symbol = 'un' WHERE name ILIKE '%unidade%' AND symbol IS NULL;
            UPDATE unit_of_measurement SET symbol = 'kg' WHERE name ILIKE '%quilo%' AND symbol IS NULL;
            UPDATE unit_of_measurement SET symbol = 'm' WHERE name ILIKE '%metro%' AND symbol IS NULL;
            UPDATE unit_of_measurement SET symbol = 'L' WHERE name ILIKE '%litro%' AND symbol IS NULL;
            UPDATE unit_of_measurement SET symbol = 'cx' WHERE name ILIKE '%caixa%' AND symbol IS NULL;
            UPDATE unit_of_measurement SET symbol = 'pct' WHERE name ILIKE '%pacote%' AND symbol IS NULL;
            
            -- Para qualquer registro sem symbol, usar as 2 primeiras letras do nome
            UPDATE unit_of_measurement 
            SET symbol = SUBSTRING(LOWER(name), 1, 2) 
            WHERE symbol IS NULL;
        END IF;
    END IF;
END $$;

-- 3. Garantir que a tabela stock_items tenha a coluna group_id
DO $$
BEGIN
    -- Verificar se a tabela stock_groups existe, se não, criar
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_name = 'stock_groups') THEN
        CREATE TABLE stock_groups (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE
        );
        
        -- Inserir grupos padrão
        INSERT INTO stock_groups (name, description)
        VALUES 
            ('Tecidos', 'Materiais têxteis'),
            ('Aviamentos', 'Botões, zíperes e outros acessórios'),
            ('Embalagens', 'Materiais para embalagem de produtos');
    END IF;
    
    -- Verificar se a coluna group_id existe na tabela stock_items, se não, criar
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_items') AND
       NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stock_items' AND column_name = 'group_id') THEN
        ALTER TABLE stock_items ADD COLUMN group_id UUID REFERENCES stock_groups(id);
    END IF;
END $$;

-- 4. Criar função para verificar estoque baixo
CREATE OR REPLACE FUNCTION get_field_ref(table_name text, row_id text, field_name text)
RETURNS numeric AS $$
DECLARE
    result numeric;
    query text;
BEGIN
    query := 'SELECT ' || quote_ident(field_name) || ' FROM ' || quote_ident(table_name) || ' WHERE id = ' || quote_literal(row_id);
    EXECUTE query INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 5. Garantir que todas as tabelas tenham timestamps de created_at e updated_at
DO $$
DECLARE
    table_rec record;
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
            EXECUTE 'ALTER TABLE ' || table_rec.table_name || ' ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()';
        END IF;
        
        -- Adicionar updated_at se não existir
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = table_rec.table_name AND column_name = 'updated_at') THEN
            EXECUTE 'ALTER TABLE ' || table_rec.table_name || ' ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE';
        END IF;
    END LOOP;
END $$;

-- 6. Criar índices para melhorar performance de consultas frequentes
-- Índices para tabela clients
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_name') THEN
            CREATE INDEX idx_clients_name ON clients(name);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_document') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'document') THEN
            CREATE INDEX idx_clients_document ON clients(document);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'clients' AND indexname = 'idx_clients_is_active') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clients' AND column_name = 'is_active') THEN
            CREATE INDEX idx_clients_is_active ON clients(is_active);
        END IF;
    END IF;
END $$;

-- Índices para tabela suppliers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'suppliers') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'suppliers' AND indexname = 'idx_suppliers_name') THEN
            CREATE INDEX idx_suppliers_name ON suppliers(name);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'suppliers' AND indexname = 'idx_suppliers_cnpj') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'cnpj') THEN
            CREATE INDEX idx_suppliers_cnpj ON suppliers(cnpj);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'suppliers' AND indexname = 'idx_suppliers_is_active') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'is_active') THEN
            CREATE INDEX idx_suppliers_is_active ON suppliers(is_active);
        END IF;
    END IF;
END $$;

-- Índices para tabela stock_items
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_items') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stock_items' AND indexname = 'idx_stock_items_name') THEN
            CREATE INDEX idx_stock_items_name ON stock_items(name);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stock_items' AND indexname = 'idx_stock_items_sku') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'sku') THEN
            CREATE INDEX idx_stock_items_sku ON stock_items(sku);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'stock_items' AND indexname = 'idx_stock_items_group_id') AND
           EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stock_items' AND column_name = 'group_id') THEN
            CREATE INDEX idx_stock_items_group_id ON stock_items(group_id);
        END IF;
    END IF;
END $$;

-- 7. Sugestões de novas tabelas e relacionamentos para integração completa entre módulos

-- Comentários sobre possíveis melhorias no schema:
/*
1. Relacionamento entre produtos e componentes:
   - A tabela product_components já existe e permite associar componentes a produtos
   - Isso é essencial para o módulo de produção calcular necessidades de materiais

2. Relacionamento entre insumos e componentes:
   - Seria útil criar uma tabela component_supplies para rastrear quais insumos são usados em cada componente
   - Isso permitiria calcular automaticamente necessidades de compra baseado na produção planejada

3. Movimentações de estoque:
   - A tabela stock_movements é essencial para rastrear entradas/saídas de estoque
   - Deve estar vinculada a ordens de produção, pedidos e compras

4. Histórico de preços:
   - Seria útil criar tabelas para histórico de preços de insumos e componentes
   - Isso permitiria análises de custo mais precisas ao longo do tempo

5. Permissões e usuários:
   - O sistema deve ter tabelas para controle de acesso e permissões por módulo
*/

-- Criação da tabela component_supplies se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                  WHERE table_name = 'component_supplies') THEN
        CREATE TABLE component_supplies (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            component_id UUID NOT NULL REFERENCES components(id),
            supply_id UUID NOT NULL REFERENCES supplies(id),
            quantity NUMERIC(10, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE,
            UNIQUE(component_id, supply_id)
        );
        
        -- Criar índices para melhorar performance
        CREATE INDEX idx_component_supplies_component_id ON component_supplies(component_id);
        CREATE INDEX idx_component_supplies_supply_id ON component_supplies(supply_id);
    END IF;
END $$;
