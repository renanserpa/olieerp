-- Script SQL para criação da tabela de fornecedores (suppliers)

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
