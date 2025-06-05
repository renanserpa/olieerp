# Instruções de Implementação do ERP Olie

Este documento contém as instruções detalhadas para implementação do sistema ERP Olie, incluindo os novos módulos de Treinamento/Universidade Corporativa e RH Avançado.

## Requisitos do Sistema

### Requisitos de Hardware
- Servidor: 4 vCPUs, 8GB RAM mínimo (recomendado 16GB)
- Armazenamento: 50GB SSD mínimo
- Largura de banda: 100Mbps mínimo

### Requisitos de Software
- Node.js 20.18.0 ou superior
- PostgreSQL 15 ou superior
- Supabase (self-hosted ou serviço em nuvem)
- Servidor web (Nginx recomendado)
- SSL/TLS para conexões seguras

## Etapas de Implementação

### 1. Configuração do Ambiente

#### 1.1 Banco de Dados
1. Crie um novo projeto no Supabase ou configure uma instância self-hosted
2. Execute os scripts de criação de tabelas na seguinte ordem:
   - `create_olie_erp_schema_complete.sql` (esquema base)
   - `permission_system_schema.sql` (sistema de permissões)
   - `schema.sql` (módulo de treinamento)

#### 1.2 Variáveis de Ambiente
1. Copie o arquivo `.env.local` para o diretório raiz do projeto
2. Atualize as seguintes variáveis:
   ```
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_do_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
   ```

### 2. Instalação da Aplicação

#### 2.1 Preparação
1. Descompacte o arquivo `olie-erp-nextjs-final.zip` em um diretório de sua escolha
2. Navegue até o diretório do projeto:
   ```bash
   cd olie-erp-nextjs
   ```

#### 2.2 Instalação de Dependências
1. Instale as dependências do projeto:
   ```bash
   npm install
   ```

#### 2.3 Build da Aplicação
1. Gere a versão de produção:
   ```bash
   npm run build
   ```

### 3. Configuração do Servidor

#### 3.1 Configuração do Nginx
1. Instale o Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Crie um arquivo de configuração para o ERP Olie:
   ```bash
   sudo nano /etc/nginx/sites-available/olie-erp
   ```

3. Adicione a seguinte configuração:
   ```nginx
   server {
       listen 80;
       server_name seu_dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. Ative a configuração:
   ```bash
   sudo ln -s /etc/nginx/sites-available/olie-erp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### 3.2 Configuração SSL (Recomendado)
1. Instale o Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. Obtenha um certificado SSL:
   ```bash
   sudo certbot --nginx -d seu_dominio.com
   ```

### 4. Inicialização da Aplicação

#### 4.1 Usando PM2 (Recomendado)
1. Instale o PM2:
   ```bash
   npm install -g pm2
   ```

2. Inicie a aplicação:
   ```bash
   pm2 start npm --name "olie-erp" -- start
   ```

3. Configure o PM2 para iniciar automaticamente:
   ```bash
   pm2 startup
   pm2 save
   ```

#### 4.2 Usando Systemd
1. Crie um arquivo de serviço:
   ```bash
   sudo nano /etc/systemd/system/olie-erp.service
   ```

2. Adicione a seguinte configuração:
   ```
   [Unit]
   Description=Olie ERP Next.js Application
   After=network.target

   [Service]
   Type=simple
   User=seu_usuario
   WorkingDirectory=/caminho/para/olie-erp-nextjs
   ExecStart=/usr/bin/npm start
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

3. Ative e inicie o serviço:
   ```bash
   sudo systemctl enable olie-erp
   sudo systemctl start olie-erp
   ```

### 5. Configuração Inicial do Sistema

#### 5.1 Criação do Usuário Administrador
1. Acesse o painel do Supabase
2. Navegue até Authentication > Users
3. Crie um novo usuário com email e senha
4. Atribua permissões de administrador:
   - Acesse o SQL Editor
   - Execute:
     ```sql
     INSERT INTO user_permissions (user_id, permission)
     VALUES ('id_do_usuario', 'admin.access');
     ```

#### 5.2 Configuração dos Módulos

##### 5.2.1 Módulo de Treinamento
1. Acesse o sistema como administrador
2. Navegue até Configurações > Treinamento
3. Crie categorias de cursos
4. Configure os requisitos de treinamento por cargo

##### 5.2.2 Módulo de RH
1. Acesse o sistema como administrador
2. Navegue até RH > Departamentos
3. Crie a estrutura organizacional
4. Configure cargos e níveis hierárquicos

### 6. Verificação da Implementação

#### 6.1 Checklist de Validação
1. Verifique o acesso ao sistema com diferentes perfis de usuário
2. Teste o fluxo completo de criação de pedidos até entrega
3. Valide os relatórios financeiros e dashboards
4. Teste o módulo de treinamento (criação de curso, matrícula, certificação)
5. Verifique o sistema de notificações

#### 6.2 Resolução de Problemas Comuns
- **Erro de conexão com o Supabase**: Verifique as variáveis de ambiente e as credenciais
- **Problemas de permissão**: Verifique as entradas na tabela user_permissions
- **Erros 500**: Verifique os logs do servidor em `/var/log/nginx/error.log`
- **Problemas de performance**: Ajuste os recursos do servidor conforme necessário

## Manutenção e Atualizações

### Backup do Banco de Dados
1. Configure backups automáticos no Supabase ou use pg_dump:
   ```bash
   pg_dump -U postgres -d olie_erp > backup_$(date +%Y%m%d).sql
   ```

### Atualizações do Sistema
1. Pare o serviço:
   ```bash
   pm2 stop olie-erp
   ```

2. Faça backup do código atual:
   ```bash
   cp -r olie-erp-nextjs olie-erp-nextjs-backup
   ```

3. Atualize o código:
   ```bash
   git pull origin main
   ```

4. Instale dependências e reconstrua:
   ```bash
   npm install
   npm run build
   ```

5. Reinicie o serviço:
   ```bash
   pm2 restart olie-erp
   ```

## Suporte e Recursos Adicionais

### Documentação
- Manual do Usuário: `/docs/modulo_treinamento_manual.md`
- Documentação Técnica: `/docs/relatorio_validacao_modulos.md`
- Estrutura do Banco de Dados: `/modulo_treinamento_estrutura.md`

### Contato para Suporte
- Email: suporte@olieerp.com.br
- Sistema de tickets: https://suporte.olieerp.com.br

---

Estas instruções foram preparadas para garantir uma implementação bem-sucedida do ERP Olie. Em caso de dúvidas ou problemas durante a implementação, consulte a documentação adicional ou entre em contato com o suporte técnico.
