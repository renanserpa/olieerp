# Estrutura do Módulo de Treinamento/Universidade Corporativa

## Visão Geral
Este documento descreve a estrutura e os componentes do módulo de Treinamento/Universidade Corporativa para o sistema Olie ERP, visando capacitação contínua dos colaboradores.

## Entidades Principais

### 1. Cursos
- ID
- Título
- Descrição
- Carga horária
- Nível (Básico, Intermediário, Avançado)
- Categoria
- Status (Rascunho, Publicado, Arquivado)
- Imagem de capa
- Data de criação
- Data de atualização
- Criado por (ID do usuário)

### 2. Módulos
- ID
- Curso ID (referência)
- Título
- Descrição
- Ordem
- Status (Rascunho, Publicado)

### 3. Aulas
- ID
- Módulo ID (referência)
- Título
- Tipo (Vídeo, Texto, Quiz, Arquivo)
- Conteúdo
- Duração estimada (minutos)
- Ordem
- Status (Rascunho, Publicado)

### 4. Matrículas
- ID
- Curso ID (referência)
- Usuário ID (referência)
- Data de matrícula
- Status (Em andamento, Concluído, Abandonado)
- Progresso (%)
- Data de conclusão

### 5. Progresso de Aulas
- ID
- Matrícula ID (referência)
- Aula ID (referência)
- Status (Não iniciado, Em andamento, Concluído)
- Tempo dedicado (minutos)
- Data de início
- Data de conclusão

### 6. Avaliações
- ID
- Curso ID (referência)
- Título
- Descrição
- Nota mínima para aprovação
- Tempo limite (minutos)
- Status (Rascunho, Publicado)

### 7. Questões
- ID
- Avaliação ID (referência)
- Pergunta
- Tipo (Múltipla escolha, Verdadeiro/Falso, Dissertativa)
- Opções (para múltipla escolha)
- Resposta correta
- Pontuação
- Ordem

### 8. Resultados de Avaliações
- ID
- Avaliação ID (referência)
- Usuário ID (referência)
- Nota obtida
- Tempo utilizado (minutos)
- Status (Aprovado, Reprovado)
- Data de realização

### 9. Certificados
- ID
- Curso ID (referência)
- Usuário ID (referência)
- Data de emissão
- Código de validação
- Status (Válido, Revogado)

## Fluxos Principais

### 1. Criação e Gestão de Cursos
- Criação de curso com informações básicas
- Adição de módulos e aulas
- Upload de materiais (vídeos, PDFs, etc.)
- Criação de avaliações e questões
- Publicação do curso

### 2. Matrícula e Realização de Cursos
- Listagem de cursos disponíveis
- Matrícula em cursos
- Visualização de aulas e materiais
- Registro automático de progresso
- Realização de avaliações
- Emissão de certificados

### 3. Acompanhamento e Relatórios
- Dashboard de progresso individual
- Relatórios de desempenho por departamento
- Estatísticas de conclusão e aproveitamento
- Exportação de relatórios

## Integrações

### 1. Com Módulo de RH
- Sincronização de dados de colaboradores
- Inclusão de cursos em planos de carreira
- Bonificações por conclusão de cursos

### 2. Com Sistema de Notificações
- Alertas de novos cursos disponíveis
- Lembretes de cursos em andamento
- Notificações de prazos e avaliações

### 3. Com Módulo de Permissões
- Definição de papéis (Instrutor, Aluno, Administrador)
- Permissões específicas para criação e gestão de conteúdo
- Restrição de acesso a cursos por departamento ou cargo

## Requisitos Técnicos

### 1. Frontend
- Componentes para player de vídeo
- Editor de texto rico para conteúdo
- Interface para criação de questionários
- Visualização de progresso e certificados

### 2. Backend
- Armazenamento de arquivos (vídeos, PDFs)
- Cálculo automático de progresso
- Sistema de avaliação e pontuação
- Geração de certificados em PDF

### 3. Banco de Dados
- Tabelas para todas as entidades descritas
- Índices para consultas frequentes
- Relacionamentos e chaves estrangeiras

## Próximos Passos
1. Criar esquema de banco de dados
2. Implementar componentes de UI básicos
3. Desenvolver APIs para CRUD de cursos e módulos
4. Implementar sistema de matrículas e progresso
5. Desenvolver sistema de avaliações
6. Criar gerador de certificados
7. Implementar relatórios e dashboards
