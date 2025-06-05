-- Script SQL para criação das tabelas de estoque, insumos e componentes

-- Tabela de grupos de estoque
CREATE TABLE IF NOT EXISTS public.stock_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de localizações de estoque
CREATE TABLE IF NOT EXISTS public.locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    capacity NUMERIC(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de unidades de medida
CREATE TABLE IF NOT EXISTS public.unit_of_measurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir unidades de medida padrão
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

-- Tabela de itens de estoque (insumos)
CREATE TABLE IF NOT EXISTS public.stock_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50),
    description TEXT,
    group_id UUID REFERENCES public.stock_groups(id),
    location_id UUID REFERENCES public.locations(id),
    unit_of_measure VARCHAR(10) DEFAULT 'un',
    quantity NUMERIC(10, 2) DEFAULT 0,
    min_quantity NUMERIC(10, 2) DEFAULT 0,
    cost_price NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'OK',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_stock_items_name ON public.stock_items(name);
CREATE INDEX IF NOT EXISTS idx_stock_items_sku ON public.stock_items(sku);
CREATE INDEX IF NOT EXISTS idx_stock_items_group ON public.stock_items(group_id);
CREATE INDEX IF NOT EXISTS idx_stock_items_location ON public.stock_items(location_id);

-- Tabela de movimentações de estoque
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stock_item_id UUID NOT NULL REFERENCES public.stock_items(id),
    quantity NUMERIC(10, 2) NOT NULL,
    movement_type VARCHAR(20) NOT NULL, -- entrada, saida, ajuste, transferencia
    source_location_id UUID REFERENCES public.locations(id),
    destination_location_id UUID REFERENCES public.locations(id),
    reference_document VARCHAR(100),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de componentes
CREATE TABLE IF NOT EXISTS public.components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação entre componentes e insumos
CREATE TABLE IF NOT EXISTS public.componente_insumo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    componente_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
    insumo_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
    quantidade NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unidade_medida_id UUID REFERENCES public.unit_of_measurement(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(componente_id, insumo_id)
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sku VARCHAR(50),
    price NUMERIC(10, 2),
    cost_price NUMERIC(10, 2),
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relação entre produtos e componentes
CREATE TABLE IF NOT EXISTS public.product_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES public.components(id) ON DELETE CASCADE,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, component_id)
);
