-- Script SQL para criação de todas as tabelas necessárias para o ERP Olie

-- Extensão para geração de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TABELAS DE CLIENTES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    document VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_document ON public.clients(document);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_city ON public.clients(city);

-- Tabela de contatos adicionais de clientes
CREATE TABLE IF NOT EXISTS public.client_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de endereços adicionais de clientes
CREATE TABLE IF NOT EXISTS public.client_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    address_type VARCHAR(50) NOT NULL, -- 'faturamento', 'entrega', etc.
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias de clientes
CREATE TABLE IF NOT EXISTS public.client_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento entre clientes e categorias
CREATE TABLE IF NOT EXISTS public.client_category_relations (
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.client_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (client_id, category_id)
);

-- ==========================================
-- TABELAS DE FORNECEDORES
-- ==========================================

-- Tabela de status de fornecedores
CREATE TABLE IF NOT EXISTS public.supplier_statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir status padrão se não existirem
INSERT INTO public.supplier_statuses (name, description)
SELECT 'Ativo', 'Fornecedor ativo e disponível para compras'
WHERE NOT EXISTS (SELECT 1 FROM public.supplier_statuses WHERE name = 'Ativo');

INSERT INTO public.supplier_statuses (name, description)
SELECT 'Inativo', 'Fornecedor temporariamente inativo'
WHERE NOT EXISTS (SELECT 1 FROM public.supplier_statuses WHERE name = 'Inativo');

INSERT INTO public.supplier_statuses (name, description)
SELECT 'Bloqueado', 'Fornecedor bloqueado para novas compras'
WHERE NOT EXISTS (SELECT 1 FROM public.supplier_statuses WHERE name = 'Bloqueado');

-- Tabela principal de fornecedores
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    fantasy_name VARCHAR(255),
    cnpj VARCHAR(20),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    status VARCHAR(50) DEFAULT 'Ativo',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON public.suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_cnpj ON public.suppliers(cnpj);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);

-- Tabela de contatos de fornecedores
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de documentos de fornecedores
CREATE TABLE IF NOT EXISTS public.supplier_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    file_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de categorias de fornecedores
CREATE TABLE IF NOT EXISTS public.supplier_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de relacionamento entre fornecedores e categorias
CREATE TABLE IF NOT EXISTS public.supplier_category_relations (
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.supplier_categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (supplier_id, category_id)
);

-- ==========================================
-- TABELAS DE ESTOQUE, INSUMOS E COMPONENTES
-- ==========================================

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
