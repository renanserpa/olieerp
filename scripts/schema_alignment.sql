// Script SQL para alinhamento do schema do banco de dados com o frontend
// Este script contém as alterações necessárias para garantir compatibilidade total

-- Tabela unit_of_measurement (já existente, verificar se precisa de ajustes)
CREATE TABLE IF NOT EXISTS public.unit_of_measurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_unit_of_measurement_name ON public.unit_of_measurement(name);
CREATE INDEX IF NOT EXISTS idx_unit_of_measurement_symbol ON public.unit_of_measurement(symbol);

-- Garantir que a tabela stock_items tenha o campo unit_of_measurement_id em vez de unit_of_measure
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_items' AND column_name = 'unit_of_measure'
    ) THEN
        ALTER TABLE public.stock_items RENAME COLUMN unit_of_measure TO unit_of_measurement_id;
    END IF;
    
    -- Garantir que o campo unit_of_measurement_id seja do tipo UUID
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_items' AND column_name = 'unit_of_measurement_id'
    ) THEN
        ALTER TABLE public.stock_items ADD COLUMN unit_of_measurement_id UUID REFERENCES public.unit_of_measurement(id);
    END IF;
END $$;

-- Garantir que todas as tabelas tenham o campo is_active em vez de status
DO $$
BEGIN
    -- Tabela components
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'components' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.components RENAME COLUMN status TO is_active;
        ALTER TABLE public.components ALTER COLUMN is_active TYPE BOOLEAN USING 
            CASE 
                WHEN status = 'active' THEN TRUE
                WHEN status = 'inactive' THEN FALSE
                ELSE TRUE
            END;
    END IF;
    
    -- Verificar se is_active já existe, caso contrário adicionar
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'components' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.components ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    -- Mesma verificação para a tabela insumos
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insumos' AND column_name = 'status'
    ) THEN
        ALTER TABLE public.insumos RENAME COLUMN status TO is_active;
        ALTER TABLE public.insumos ALTER COLUMN is_active TYPE BOOLEAN USING 
            CASE 
                WHEN status = 'active' THEN TRUE
                WHEN status = 'inactive' THEN FALSE
                ELSE TRUE
            END;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'insumos' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE public.insumos ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Inserir unidades de medida padrão se não existirem
INSERT INTO public.unit_of_measurement (name, symbol, description)
SELECT 'Unidade', 'un', 'Unidade individual'
WHERE NOT EXISTS (SELECT 1 FROM public.unit_of_measurement WHERE symbol = 'un');

INSERT INTO public.unit_of_measurement (name, symbol, description)
SELECT 'Quilograma', 'kg', 'Medida de peso'
WHERE NOT EXISTS (SELECT 1 FROM public.unit_of_measurement WHERE symbol = 'kg');

INSERT INTO public.unit_of_measurement (name, symbol, description)
SELECT 'Metro', 'm', 'Medida de comprimento'
WHERE NOT EXISTS (SELECT 1 FROM public.unit_of_measurement WHERE symbol = 'm');

INSERT INTO public.unit_of_measurement (name, symbol, description)
SELECT 'Litro', 'L', 'Medida de volume'
WHERE NOT EXISTS (SELECT 1 FROM public.unit_of_measurement WHERE symbol = 'L');

INSERT INTO public.unit_of_measurement (name, symbol, description)
SELECT 'Caixa', 'cx', 'Caixa com múltiplas unidades'
WHERE NOT EXISTS (SELECT 1 FROM public.unit_of_measurement WHERE symbol = 'cx');

INSERT INTO public.unit_of_measurement (name, symbol, description)
SELECT 'Pacote', 'pct', 'Pacote com múltiplas unidades'
WHERE NOT EXISTS (SELECT 1 FROM public.unit_of_measurement WHERE symbol = 'pct');

-- Criar índices para melhorar performance de consultas frequentes
CREATE INDEX IF NOT EXISTS idx_stock_items_name ON public.stock_items(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_sku ON public.stock_items(sku);
CREATE INDEX IF NOT EXISTS idx_stock_items_group ON public.stock_items(group_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_is_active ON public.suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_components_is_active ON public.components(is_active);
CREATE INDEX IF NOT EXISTS idx_insumos_is_active ON public.insumos(is_active);
