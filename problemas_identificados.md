# Problemas Identificados no Projeto Olie ERP

Após uma análise detalhada do código-fonte, foram identificados os seguintes problemas estruturais que precisam ser corrigidos:

## 1. Duplicidade de Funções e Hooks

### Problema:
- Existem duas implementações diferentes de funções utilitárias para interação com o Supabase:
  - `/src/lib/data-hooks.ts`: Contém funções como `createClient`, `getRecords`, etc.
  - `/src/lib/utils/data-hooks.ts`: Contém hooks como `useSuppliers`, `useClients`, etc.

### Impacto:
- A função `createClient` está definida múltiplas vezes, causando erro de compilação
- Imports inconsistentes entre arquivos do projeto
- Comportamentos diferentes para operações semelhantes

## 2. Problemas de Tipagem em Componentes UI

### Problema:
- Incompatibilidade entre props esperadas e fornecidas em componentes como DateRangePicker
- No Dashboard.tsx, o componente DateRangePicker é usado com props `value` e `onChange`, mas o componente espera `date` e `onDateChange`
- O componente ReportExporter recebe um objeto em vez de um array na prop `data`

### Impacto:
- Erros de tipagem que impedem a compilação
- Comportamento inesperado em runtime

## 3. Acesso Inseguro a Arrays Aninhados

### Problema:
- Em Dashboard.tsx, há acessos a arrays aninhados retornados pelo Supabase sem verificação adequada
- Exemplos: `item.products[0]?.product_categories`, `item.global_statuses[0]?.name`

### Impacto:
- Potenciais erros em runtime se a estrutura dos dados não corresponder ao esperado

## 4. Incompatibilidade de Tipos no react-hook-form

### Problema:
- No ClientForm.tsx, há incompatibilidade entre o tipo do resolver do Zod e o tipo esperado pelo react-hook-form
- Problemas com o tipo ClientFormValues e is_active como booleano obrigatório

### Impacto:
- Erros de tipagem que impedem a compilação

## 5. Enums e Variantes Incorretos

### Problema:
- Uso de variantes inexistentes em componentes como Badge (ex: 'success' quando só existem 'secondary', 'destructive', 'default', 'outline')
- Incompatibilidade entre tipos definidos e props utilizadas

### Impacto:
- Erros de tipagem que impedem a compilação
- Renderização incorreta de componentes

## 6. Desalinhamento entre Schema do Banco e Código

### Problema:
- Tabelas referenciadas no código que não existem no schema Supabase
- Campos obrigatórios ausentes em operações de insert/update
- Incompatibilidade entre tipos definidos no frontend e estrutura real do banco

### Impacto:
- Erros em runtime ao tentar acessar tabelas ou campos inexistentes
- Falhas em operações de CRUD

## 7. Imports Incorretos ou Inexistentes

### Problema:
- Imports apontando para arquivos incorretos ou funções inexistentes
- Exemplo: `import { getClients } from "@/lib/utils/data-hooks"` quando a função não existe nesse arquivo

### Impacto:
- Erros de compilação
- Funcionalidades quebradas

## 8. Props Obsoletas em Componentes

### Problema:
- Uso de props que não existem mais nas versões atuais dos componentes
- Exemplo: `filterColumn` e `filterPlaceholder` em DataTable

### Impacto:
- Erros de tipagem que impedem a compilação
- Funcionalidades não implementadas

## 9. Problemas em Contextos Globais

### Problema:
- Manipulação incorreta de arrays aninhados em auth-context.tsx
- Acesso a propriedades inexistentes em objetos
- Conversões de tipo inadequadas

### Impacto:
- Erros em runtime
- Comportamento inesperado da autenticação

## 10. Incompatibilidade em Componentes de Terceiros

### Problema:
- Props obrigatórias ausentes no componente Calendar do react-day-picker
- Tipagem incorreta em handlers de eventos (onSelect)
- Incompatibilidade entre versões de componentes e suas tipagens

### Impacto:
- Erros de tipagem que impedem a compilação
- Comportamento inesperado dos componentes
