# Guia do Desenvolvedor - Frontend ERP Olie (Next.js)

## 1. Introdução

Este documento serve como um guia para desenvolvedores que trabalharão no frontend do sistema ERP Olie. O frontend foi construído utilizando Next.js (App Router), TypeScript, Tailwind CSS e Shadcn/UI, e se conecta ao backend Velo by Wix através de HTTP Functions.

O objetivo deste frontend é fornecer uma interface de usuário moderna, responsiva e eficiente para gerenciar os diversos módulos do ERP, incluindo Estoque, Pedidos, Produção, Produtos, e potencialmente outros módulos futuros.

Este guia cobre a estrutura do projeto, as tecnologias utilizadas, como configurar o ambiente de desenvolvimento, executar o projeto localmente, realizar o build para produção e entender a integração com o backend.

## 2. Estrutura do Projeto

O projeto segue a estrutura padrão recomendada pelo Next.js App Router, com algumas adições específicas para a organização do código:

```
/home/ubuntu/olie_erp_frontend/frontend_nextjs_prototype/
├── .next/           # Diretório de build do Next.js (gerado)
├── .vscode/         # Configurações do VSCode (opcional)
├── node_modules/    # Dependências do projeto (gerado pelo pnpm)
├── public/          # Arquivos estáticos (imagens, fontes, etc.)
│   └── next.svg
│   └── vercel.svg
├── src/
│   ├── app/         # Diretório principal do App Router
│   │   ├── (modules)/ # Agrupamento de rotas para módulos do ERP
│   │   │   ├── estoque/
│   │   │   │   ├── materiais/
│   │   │   │   │   ├── [id]/page.tsx # Detalhe do material
│   │   │   │   │   ├── novo/page.tsx   # Cadastro de material
│   │   │   │   │   └── page.tsx      # Listagem de materiais
│   │   │   ├── pedidos/
│   │   │   │   ├── [id]/page.tsx # Detalhe do pedido
│   │   │   │   ├── novo/page.tsx   # Cadastro de pedido
│   │   │   │   └── page.tsx      # Listagem de pedidos
│   │   │   ├── producao/
│   │   │   │   ├── [id]/page.tsx # Detalhe da ordem de produção
│   │   │   │   └── page.tsx      # Listagem de ordens de produção
│   │   │   ├── produtos/
│   │   │   │   ├── [id]/page.tsx # Detalhe do produto
│   │   │   │   ├── novo/page.tsx   # Cadastro de produto
│   │   │   │   └── page.tsx      # Listagem de produtos
│   │   │   └── layout.tsx    # Layout compartilhado para os módulos
│   │   ├── favicon.ico
│   │   ├── globals.css # Estilos globais (Tailwind)
│   │   ├── layout.tsx    # Layout raiz da aplicação
│   │   └── page.tsx      # Página inicial (Dashboard)
│   ├── components/    # Componentes React reutilizáveis
│   │   └── ui/        # Componentes do Shadcn/UI (botões, inputs, etc.)
│   ├── data/          # Dados mockados para desenvolvimento inicial
│   │   └── mockData.ts
│   ├── hooks/         # Hooks React customizados
│   │   └── use-toast.ts # Hook para notificações (toast)
│   ├── lib/           # Funções utilitárias e configuração de bibliotecas
│   │   ├── api.ts       # Funções para chamar a API Velo (descontinuado, usar wixClient)
│   │   ├── utils.ts     # Funções utilitárias gerais (ex: cn para Tailwind)
│   │   ├── velo-sim.ts  # Simulação das funções Velo (para dev sem backend)
│   │   └── wixClient.ts # Configuração do cliente Wix SDK para chamadas HTTP
│   └── types/         # Definições de tipos TypeScript globais (se necessário)
├── .eslintrc.json   # Configuração do ESLint
├── .gitignore       # Arquivos ignorados pelo Git
├── next-env.d.ts    # Tipos do Next.js para TypeScript
├── next.config.mjs  # Configuração do Next.js
├── package.json     # Metadados e dependências do projeto
├── pnpm-lock.yaml   # Lockfile do PNPM
├── postcss.config.mjs # Configuração do PostCSS (usado pelo Tailwind)
├── README.md        # README do projeto (pode ser este guia)
├── tailwind.config.ts # Configuração do Tailwind CSS
└── tsconfig.json    # Configuração do TypeScript
```

**Principais Diretórios:**

*   `/src/app`: Contém todas as rotas, layouts e páginas da aplicação, seguindo a convenção do App Router.
    *   `/src/app/(modules)`: Agrupa as rotas relacionadas aos módulos principais do ERP (Estoque, Pedidos, etc.) sob um layout comum, sem afetar a URL final.
*   `/src/components`: Armazena componentes React reutilizáveis. Os componentes específicos do Shadcn/UI ficam em `/src/components/ui`.
*   `/src/lib`: Contém lógica de bibliotecas, utilitários e a configuração da comunicação com o backend.
    *   `wixClient.ts`: Arquivo crucial que configura o Wix SDK para realizar chamadas às HTTP Functions do Velo.
    *   `velo-sim.ts`: Usado durante o desenvolvimento inicial para simular respostas do backend Velo, permitindo o desenvolvimento do frontend sem dependência direta do backend.
*   `/src/data`: Contém dados mockados (`mockData.ts`) usados pelo `velo-sim.ts`.
*   `/public`: Para arquivos estáticos acessíveis publicamente.

## 3. Tecnologias Utilizadas

*   **Framework:** Next.js 15+ (com App Router)
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS
*   **Componentes UI:** Shadcn/UI
*   **Gerenciador de Pacotes:** PNPM
*   **Integração Backend:** Wix Fetch API (via Wix SDK configurado em `wixClient.ts`) para chamar Velo HTTP Functions.
*   **Linting:** ESLint
*   **Formatação:** Prettier (configuração pode ser adicionada)




## 4. Configuração do Ambiente

Para configurar o ambiente de desenvolvimento, siga os passos abaixo:

1.  **Clone o Repositório:**
    ```bash
    # (Comando a ser fornecido quando o repositório Git estiver disponível)
    # git clone <url_do_repositorio>
    # cd <diretorio_do_projeto>
    ```
    *Nota: No momento, o código está disponível no diretório `/home/ubuntu/olie_erp_frontend/frontend_nextjs_prototype`.*

2.  **Instale o Node.js e o PNPM:**
    *   Certifique-se de ter o Node.js instalado (versão 20.x ou superior recomendada).
    *   Instale o PNPM globalmente, se ainda não o tiver:
        ```bash
        npm install -g pnpm
        ```

3.  **Instale as Dependências:**
    Navegue até o diretório raiz do projeto (`/home/ubuntu/olie_erp_frontend/frontend_nextjs_prototype`) e execute:
    ```bash
    pnpm install
    ```
    Este comando instalará todas as dependências listadas no `package.json`.

4.  **Configure as Variáveis de Ambiente:**
    Crie um arquivo `.env.local` na raiz do projeto. Este arquivo conterá as variáveis de ambiente necessárias para a conexão com o backend Wix.
    ```.env.local
    NEXT_PUBLIC_WIX_CLIENT_ID="SEU_WIX_CLIENT_ID"
    NEXT_PUBLIC_WIX_SITE_URL="URL_DO_SEU_SITE_WIX_STUDIO"
    # Adicione outras variáveis se necessário
    ```
    *   `NEXT_PUBLIC_WIX_CLIENT_ID`: Obtenha este ID nas configurações do seu projeto Wix (Apps > Build Your App > OAuth).
    *   `NEXT_PUBLIC_WIX_SITE_URL`: A URL base do seu site Wix Studio onde o backend Velo está hospedado (ex: `https://manusaimanusai.wixstudio.io/olie-erp`).

    *Importante:* O prefixo `NEXT_PUBLIC_` é necessário para que essas variáveis sejam expostas ao frontend no Next.js.

## 5. Executando o Projeto Localmente

Após a configuração do ambiente e a instalação das dependências, você pode executar o servidor de desenvolvimento local:

```bash
pnpm run dev
```

Este comando iniciará o servidor de desenvolvimento do Next.js, geralmente na porta `http://localhost:3000`.

A aplicação tentará se conectar às HTTP Functions do Velo configuradas no seu site Wix Studio (usando a URL definida em `NEXT_PUBLIC_WIX_SITE_URL`). Certifique-se de que seu backend Velo esteja publicado e as permissões das HTTP Functions estejam configuradas corretamente (geralmente como "Anyone" para testes iniciais, mas ajuste conforme a necessidade de segurança).

**Modo de Simulação (Opcional):**

Se você precisar trabalhar no frontend sem uma conexão ativa com o backend Velo, pode modificar temporariamente os arquivos de página (ex: `/src/app/produtos/page.tsx`) para importar e usar as funções do `/src/lib/velo-sim.ts` em vez das chamadas reais via `wixClient` ou `callVeloApi`. Lembre-se de reverter essas alterações antes de fazer o commit ou deploy.

## 6. Build para Produção

Para criar uma versão otimizada do frontend para produção, execute o seguinte comando:

```bash
pnpm run build
```

Este comando realizará as seguintes etapas:

1.  Compilará o código TypeScript e React.
2.  Otimizará os assets (CSS, JavaScript, imagens).
3.  Gerará páginas estáticas (SSG) ou preparará páginas para renderização no servidor (SSR/ISR) conforme configurado.
4.  Verificará a validade dos tipos TypeScript.

O resultado do build será colocado no diretório `.next/`.

Após um build bem-sucedido, você pode iniciar o servidor de produção localmente para testar a versão otimizada:

```bash
pnpm start
```

## 7. Integração com Backend Velo (HTTP Functions)

A comunicação entre o frontend Next.js e o backend Velo é feita através de chamadas HTTP para as [HTTP Functions](https://dev.wix.com/docs/develop-websites/articles/coding-with-velo/backend-code/http-functions) expostas pelo Velo.

**Configuração:**

*   O arquivo `/src/lib/wixClient.ts` configura uma instância do Wix SDK (`createClient`) que utiliza a estratégia `ApiKeyStrategy`. Ele usa as variáveis de ambiente `NEXT_PUBLIC_WIX_CLIENT_ID` e `NEXT_PUBLIC_WIX_SITE_URL`.
*   Este cliente (`wixClient`) possui um método `fetch` que pode ser usado para fazer chamadas HTTP autenticadas (se necessário e configurado) ou não autenticadas para as funções Velo.

**Chamando as Funções:**

*   As páginas e componentes do frontend utilizam `wixClient.fetch` para chamar as HTTP Functions.
*   O caminho da função é construído relativamente à URL base do site Wix (ex: `/_functions/produto/ID_DO_PRODUTO` para buscar um produto específico).
*   O método HTTP (GET, POST, PUT, DELETE) e o corpo da requisição (para POST/PUT) são definidos na chamada `fetch`.
*   Exemplo (em `/src/app/produtos/page.tsx`):
    ```typescript
    import wixClient from "@/lib/wixClient";

    // ... dentro do useEffect ou de uma função async
    const functionPath = '/_functions/produtos';
    const response = await wixClient.fetch(functionPath, {
      method: 'GET',
    });
    if (!response.ok) { /* ... tratamento de erro ... */ }
    const data = await response.json();
    setProdutos(data as Produto[]);
    ```

**Backend Velo (http-functions.js):**

*   No lado do Velo, você precisa ter um arquivo `http-functions.js` no seu backend.
*   Neste arquivo, você define funções prefixadas com o método HTTP correspondente (ex: `get_produto`, `post_produto`).
*   Exemplo de função no Velo (`http-functions.js`):
    ```javascript
    import { ok, notFound, serverError } from 'wix-http-functions';
    import wixData from 'wix-data';

    // GET /_functions/produtos
    export async function get_produtos(request) {
      try {
        const results = await wixData.query("Produtos").find(); // Coleção "Produtos"
        return ok({ body: results.items });
      } catch (error) {
        return serverError({ body: { error: error.message } });
      }
    }

    // GET /_functions/produto/{id}
    export async function get_produto(request) {
      const produtoId = request.path[0]; // Pega o ID da URL
      try {
        const produto = await wixData.get("Produtos", produtoId);
        if (produto) {
          return ok({ body: produto });
        } else {
          return notFound({ body: { error: "Produto não encontrado" } });
        }
      } catch (error) {
        return serverError({ body: { error: error.message } });
      }
    }
    
    // POST /_functions/produto
    export async function post_produto(request) {
       try {
          const body = await request.body.json();
          const itemToInsert = {
             nome: body.nome,
             precoBase: body.precoBase,
             tempoProducaoEstimado: body.tempoProducaoEstimado,
             // Mapeie outros campos conforme necessário
          };
          const insertedItem = await wixData.insert("Produtos", itemToInsert);
          return ok({ body: insertedItem });
       } catch (error) {
          return serverError({ body: { error: error.message } });
       }
    }
    ```
*   **Permissões:** Lembre-se de configurar as permissões para cada função HTTP no Velo (ex: "Anyone", "Site Member", etc.) para controlar quem pode acessá-las.

## 8. Considerações Adicionais

*   **Tipagem:** Os tipos definidos no frontend (ex: `Produto`, `Pedido`) devem ser mantidos sincronizados com a estrutura de dados retornada pelo backend Velo.
*   **Gerenciamento de Estado:** Para estados mais complexos ou compartilhados entre componentes, considere adicionar uma biblioteca de gerenciamento de estado como Zustand ou Redux Toolkit.
*   **Autenticação:** A autenticação de usuários (login/logout) e a passagem de tokens/sessões para o backend Velo não foram implementadas neste estágio inicial, mas são cruciais para um sistema de produção. O Wix SDK oferece mecanismos para lidar com a autenticação de membros do site.
*   **Testes:** Testes unitários e de integração devem ser adicionados para garantir a qualidade e a estabilidade do código. Ferramentas como Jest e React Testing Library podem ser utilizadas.
*   **Deploy:** O deploy pode ser feito facilmente na Vercel, que tem integração nativa com Next.js. Conecte seu repositório Git à Vercel e configure as variáveis de ambiente necessárias.


