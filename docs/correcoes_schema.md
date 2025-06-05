# Correções de Schema e Alinhamento Frontend-Backend

## Problema Identificado: Inconsistência entre campos `status` e `is_active`

### Descrição do Problema
O sistema apresenta inconsistências entre o schema do banco de dados e o código frontend:

1. No banco de dados, algumas tabelas usam o campo `is_active` (boolean) para indicar se um registro está ativo ou inativo
2. No código frontend, alguns componentes usam `accessorKey: "status"` para acessar esse campo
3. Isso causa o erro `ERROR: 42703: column "status" does not exist` quando o frontend tenta acessar uma coluna que não existe

### Tabelas Afetadas
- `components` - Usa `is_active` no banco, mas alguns componentes frontend tentam acessar `status`
- `stock_items` - Usa `is_active` no banco, mas alguns componentes frontend tentam acessar `status`
- `suppliers` - Tem ambos os campos `status` e `is_active`, causando confusão

### Correções Necessárias no Frontend

#### 1. Corrigir InsumoColumns.tsx
```typescript
// ANTES
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const isActive = row.original.is_active !== false;
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Ativo" : "Inativo"}
      </Badge>
    );
  },
},

// DEPOIS
{
  accessorKey: "is_active",
  header: "Status",
  cell: ({ row }) => {
    const isActive = row.original.is_active !== false;
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? "Ativo" : "Inativo"}
      </Badge>
    );
  },
},
```

#### 2. Verificar e corrigir todos os arquivos que usam `accessorKey: "status"` incorretamente:
- Arquivos encontrados com o problema:
  - `InsumoColumns.tsx`
  - `StockItemColumns.tsx`
  - Vários outros arquivos nos diferentes pacotes

### Correções Necessárias no Backend

#### 1. Padronizar o uso de `is_active` em todas as tabelas
- Manter apenas o campo `is_active` (boolean) em todas as tabelas
- Remover o campo `status` (varchar) onde existir
- Exceção: manter `status` apenas em tabelas onde ele representa um estado de processo (como pedidos, entregas) e não um simples ativo/inativo

#### 2. Script SQL para Correção
```sql
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
            -- Não remover status neste caso pois suppliers usa ambos os campos
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

-- Verificar se a coluna is_active existe na tabela stock_items, se não, criar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stock_items' AND column_name = 'is_active') THEN
        ALTER TABLE stock_items ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Se existir coluna status, migrar dados
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'stock_items' AND column_name = 'status') THEN
            UPDATE stock_items SET is_active = (status = 'Ativo' OR status = 'ativo');
            ALTER TABLE stock_items DROP COLUMN status;
        END IF;
    END IF;
END $$;
```

### Recomendações Adicionais
1. Padronizar o uso de `is_active` em todo o sistema para indicar se um registro está ativo/inativo
2. Usar `status` apenas para representar estados de processo (ex: "Em Andamento", "Concluído", etc.)
3. Atualizar a documentação para refletir essa padronização
4. Implementar validações no frontend para garantir que os campos corretos sejam usados

