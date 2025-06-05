# Guia de Implementação e Alinhamento do ERP Olie

Este documento contém instruções detalhadas para implementação e alinhamento do ERP Olie, garantindo que todos os módulos funcionem corretamente com o schema real do banco de dados Supabase.

## Visão Geral das Melhorias

O código foi completamente revisado e alinhado para garantir:

1. **Compatibilidade com o Schema Real**: Todas as interfaces e tipos foram atualizados para corresponder exatamente às tabelas e colunas do banco de dados.
2. **Padronização de Imports**: Todos os imports do componente AdvancedFilters foram padronizados para usar o caminho global.
3. **Correção de Props**: Props obsoletas como `filterColumn` e `filterPlaceholder` foram removidas dos componentes DataTable.
4. **Estrutura de Rotas Next.js**: As rotas foram organizadas seguindo as melhores práticas do Next.js 14, incluindo páginas de edição em `/[id]/edit`.
5. **Implementação CRUD Completa**: Todos os módulos agora têm operações CRUD completas integradas ao Supabase.
6. **Filtros Avançados**: Implementação padronizada de filtros avançados em todos os módulos principais.
7. **Alertas de Estoque Baixo**: Sistema de alertas para itens com estoque abaixo do mínimo.
8. **Dashboard Funcional**: Visão geral do sistema com estatísticas e alertas.

## Instruções de Implementação

### 1. Executar Scripts SQL

Antes de substituir os arquivos do frontend, execute os scripts SQL para alinhar o schema do banco de dados:

1. Execute o script `scripts/schema_alignment_suggestions.sql` no seu banco de dados Supabase.
2. Este script fará as seguintes alterações:
   - Padronização de campos `is_active` (boolean) em vez de `status` (varchar)
   - Criação de tabelas e colunas faltantes
   - Adição de índices para melhorar performance
   - Criação de funções para verificar estoque baixo
   - Sugestões de novas tabelas e relacionamentos

### 2. Substituir Arquivos do Frontend

Após executar os scripts SQL:

1. Substitua os arquivos do seu projeto pelos arquivos contidos no pacote `olie-erp-final.zip`.
2. Certifique-se de manter quaisquer configurações específicas do seu ambiente (variáveis de ambiente, etc.).

### 3. Verificar Integridade do Código

Após substituir os arquivos:

1. Execute `pnpm install` para garantir que todas as dependências estejam instaladas.
2. Execute `pnpm tsc` para verificar se não há erros de TypeScript.
3. Execute `pnpm build` para garantir que o projeto compila sem erros.

## Detalhes dos Módulos Implementados

### Clientes

- Listagem com filtros avançados
- Importação/exportação CSV
- Seleção de colunas visíveis
- Navegação direta ao clicar no nome do cliente
- Formulário de cadastro/edição com validações

### Fornecedores

- Listagem com filtros avançados
- Importação/exportação CSV
- Seleção de colunas visíveis
- Navegação direta ao clicar no nome do fornecedor
- Formulário de cadastro/edição com validações

### Estoque

- Listagem com filtros avançados, incluindo filtro de estoque baixo
- Importação/exportação CSV
- Seleção de colunas visíveis
- Navegação direta ao clicar no nome do item
- Formulário de cadastro/edição com validações
- Integração com grupos de estoque e localizações

### Componentes

- Listagem com filtros avançados
- Importação/exportação CSV
- Seleção de colunas visíveis
- Navegação direta ao clicar no nome do componente
- Formulário de cadastro/edição com validações
- Integração com categorias e unidades de medida

### Insumos

- Listagem com filtros avançados, incluindo filtro de estoque baixo
- Importação/exportação CSV
- Seleção de colunas visíveis
- Navegação direta ao clicar no nome do insumo
- Formulário de cadastro/edição com validações
- Integração com fornecedores e unidades de medida

### Dashboard

- Cards de estatísticas (clientes, fornecedores, pedidos, produtos)
- Alertas de estoque baixo
- Gráfico de vendas recentes (placeholder)

## Sugestões para Próximos Passos

1. **Implementar Gráficos Reais**: Substituir os placeholders de gráficos por visualizações reais usando bibliotecas como Chart.js ou Recharts.
2. **Melhorar Validações**: Adicionar máscaras e validações mais específicas para campos como CPF/CNPJ, telefone, etc.
3. **Implementar Autenticação e Autorização**: Configurar regras de acesso baseadas em perfis de usuário.
4. **Adicionar Testes Automatizados**: Implementar testes unitários e de integração para garantir a qualidade do código.
5. **Otimizar Queries**: Refinar as consultas ao banco de dados para melhorar performance em grandes volumes de dados.

## Possíveis Problemas e Soluções

### Problema: Erro "column 'status' does not exist"

**Solução**: Execute o script SQL fornecido para converter campos `status` para `is_active` em todas as tabelas.

### Problema: Erro "Can't resolve './_components/AdvancedFilters'"

**Solução**: Todos os imports foram padronizados para usar o caminho global:
```typescript
import { AdvancedFilters, type FilterOption } from "@/components/ui/advanced-filters";
```

### Problema: Erro "React.Children.only expected to receive a single React element child"

**Solução**: Todos os componentes foram revisados para garantir que componentes que esperam um único filho recebam apenas um elemento React.

## Contato e Suporte

Se encontrar problemas durante a implementação ou tiver dúvidas sobre o funcionamento do sistema, entre em contato com a equipe de desenvolvimento.

---

Documento gerado em: 02/06/2025
