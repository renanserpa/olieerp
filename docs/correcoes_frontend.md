# Correções de Frontend - Problemas de Importação e Estrutura

## Problema 1: Erro "Can't resolve './_components/AdvancedFilters'"

### Descrição
O erro `Module not found: Can't resolve './_components/AdvancedFilters'` ocorre porque:
1. O componente AdvancedFilters não existe em alguns diretórios
2. Os imports estão usando caminhos relativos inconsistentes
3. Há problemas de case sensitivity em alguns sistemas

### Solução Implementada

#### 1. Criar Componente Global AdvancedFilters
- Localização: `src/components/ui/advanced-filters.tsx`
- Componente consolidado que funciona para todos os módulos
- Suporte a diferentes tipos de filtros (text, select, date, boolean)

#### 2. Padronizar Imports
Substituir todas as importações locais por importação global:

```typescript
// ANTES (problemático)
import { AdvancedFilters, type FilterOption } from "./_components/AdvancedFilters";

// DEPOIS (correto)
import { AdvancedFilters, type FilterOption } from "@/components/ui/advanced-filters";
```

#### 3. Arquivos que precisam ser corrigidos:
- `/app/(dashboard)/insumos/page.tsx`
- `/app/(dashboard)/componentes/page.tsx`
- `/app/(dashboard)/clientes/page.tsx`
- `/app/(dashboard)/fornecedores/page.tsx`
- `/app/(dashboard)/compras/page.tsx`
- `/app/(dashboard)/logistica/page.tsx`
- `/app/(dashboard)/estoque/page.tsx`

## Problema 2: Inconsistência nos accessorKey dos Columns

### Descrição
Alguns arquivos de colunas usam `accessorKey: "status"` mas acessam `row.original.is_active`, causando inconsistências.

### Correções Necessárias

#### 1. InsumoColumns.tsx
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

#### 2. StockItemColumns.tsx
Aplicar a mesma correção para garantir consistência.

#### 3. Outros arquivos de colunas
Verificar e corrigir todos os arquivos que usam `accessorKey: "status"` incorretamente.

## Problema 3: Props Obsoletas em DataTable

### Descrição
Props como `filterColumn` e `filterPlaceholder` foram removidas dos componentes DataTable mas ainda são passadas em alguns lugares.

### Solução
Remover essas props dos componentes que as utilizam:

```typescript
// ANTES
<DataTable
  columns={columns}
  data={data}
  filterColumn="name"
  filterPlaceholder="Filtrar por nome..."
/>

// DEPOIS
<DataTable
  columns={columns}
  data={data}
/>
```

## Problema 4: Estrutura de Rotas Next.js

### Descrição
Algumas rotas não seguem as convenções do Next.js 14, especialmente as páginas de edição.

### Solução
Garantir que as rotas sigam o padrão:
- Listagem: `/modulo/page.tsx`
- Criação: `/modulo/novo/page.tsx`
- Edição: `/modulo/[id]/edit/page.tsx`
- Visualização: `/modulo/[id]/page.tsx`

## Problema 5: Cache do Next.js/Turbopack

### Descrição
Problemas de cache podem causar erros de importação mesmo após as correções.

### Solução
Limpar o cache do Next.js:

```bash
# Remover a pasta .next
rm -rf .next

# Remover cache do node_modules
rm -rf node_modules/.cache

# Reinstalar dependências (se necessário)
npm install

# Iniciar o servidor
npm run dev
```

## Implementação das Correções

### Passo 1: Criar o Componente Global
1. Criar o arquivo `src/components/ui/advanced-filters.tsx` com o componente consolidado
2. Garantir que o componente suporte todos os tipos de filtros necessários

### Passo 2: Atualizar Imports
1. Localizar todos os arquivos que importam AdvancedFilters localmente
2. Substituir pelos imports globais
3. Verificar se não há erros de compilação

### Passo 3: Corrigir accessorKey
1. Localizar todos os arquivos de colunas com `accessorKey: "status"`
2. Verificar se devem usar `is_active` ou manter `status`
3. Aplicar as correções necessárias

### Passo 4: Remover Props Obsoletas
1. Localizar componentes DataTable que recebem props obsoletas
2. Remover essas props
3. Testar se a funcionalidade continua funcionando

### Passo 5: Limpar Cache
1. Executar comandos de limpeza de cache
2. Reiniciar o servidor de desenvolvimento
3. Testar se os erros foram resolvidos

## Testes Recomendados

Após aplicar as correções:

1. **Teste de Compilação**: Verificar se o projeto compila sem erros
2. **Teste de Navegação**: Navegar por todos os módulos
3. **Teste de Filtros**: Testar os filtros avançados em cada módulo
4. **Teste de CRUD**: Testar criação, edição e exclusão em cada módulo
5. **Teste de Responsividade**: Verificar em diferentes tamanhos de tela

## Observações Importantes

1. **Backup**: Sempre fazer backup antes de aplicar as correções
2. **Testes Graduais**: Aplicar as correções módulo por módulo
3. **Documentação**: Atualizar a documentação após as correções
4. **Versionamento**: Usar controle de versão para rastrear as mudanças

