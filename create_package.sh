#!/bin/bash

# Script para compactar todos os arquivos do projeto
# Criado para o ERP Olie - Módulos de Estoque, Insumos e Componentes

echo "Iniciando compactação dos arquivos..."

# Criar diretório temporário para organizar os arquivos
mkdir -p /tmp/olie-erp-package

# Copiar arquivos principais
cp -r /home/ubuntu/codigo-estoque/* /tmp/olie-erp-package/

# Criar arquivo README.md com instruções básicas
cat > /tmp/olie-erp-package/README.md << 'EOF'
# ERP Olie - Módulos de Estoque, Insumos e Componentes

Este pacote contém a implementação completa dos módulos de Estoque, Insumos, Componentes, Fornecedores e Clientes para o ERP Olie.

## Conteúdo do Pacote

- **src/**: Código-fonte da aplicação
- **scripts/**: Scripts SQL para criação das tabelas no Supabase
- **guia-implementacao-modulos.md**: Documentação detalhada sobre as implementações

## Instruções Rápidas

1. Execute os scripts SQL no Supabase para criar as tabelas necessárias
2. Inicie a aplicação com `npm run dev`
3. Acesse os módulos através do menu lateral

Para mais detalhes, consulte o arquivo `guia-implementacao-modulos.md`.
EOF

# Criar o arquivo ZIP final
cd /tmp
zip -r /home/ubuntu/olie-erp-modulos-estoque-insumos-componentes.zip olie-erp-package

# Limpar diretório temporário
rm -rf /tmp/olie-erp-package

echo "Compactação concluída: /home/ubuntu/olie-erp-modulos-estoque-insumos-componentes.zip"
