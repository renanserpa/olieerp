// /src/lib/velo-sim.ts
// Simula as chamadas para as funções de backend do Velo

import { mockProdutos, mockPedidos, mockItensPedido, mockOrdensProducao } from "../data/mockData";

// Simula um atraso de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Produtos --- 

export const veloListarProdutos = async () => {
  await delay(500); // Simula atraso
  console.log("[Velo Sim] Chamando listarProdutos()");
  // No Velo real, isso chamaria a função backend
  // return await wixWindow.backend.listarProdutos();
  return mockProdutos; 
};

export const veloObterProduto = async (id: string) => {
  await delay(300);
  console.log(`[Velo Sim] Chamando obterProduto(${id})`);
  const produto = mockProdutos.find(p => p._id === id);
  if (!produto) {
    throw new Error(`Produto com ID ${id} não encontrado (simulado).`);
  }
  return produto;
};

export const veloSalvarProduto = async (dados: any) => {
  await delay(800);
  console.log("[Velo Sim] Chamando salvarProduto() com dados:", dados);
  if (dados._id) {
    // Simula atualização
    const index = mockProdutos.findIndex(p => p._id === dados._id);
    if (index > -1) {
      mockProdutos[index] = { ...mockProdutos[index], ...dados, _updatedDate: new Date() };
      return mockProdutos[index];
    }
    throw new Error(`Produto com ID ${dados._id} não encontrado para atualizar (simulado).`);
  } else {
    // Simula inserção
    const novoProduto = { 
      ...dados, 
      _id: `prod-${Date.now()}`,
      _createdDate: new Date(),
      _updatedDate: new Date(),
      ativo: true 
    };
    mockProdutos.push(novoProduto);
    return novoProduto;
  }
};

// --- Pedidos ---

export const veloListarPedidosRecentes = async (limit = 50) => {
  await delay(600);
  console.log(`[Velo Sim] Chamando listarPedidosRecentes(${limit})`);
  return mockPedidos.slice(0, limit);
};

// Função FALTANTE no backend real (simulada aqui)
export const veloObterPedido = async (id: string) => {
  await delay(400);
  console.log(`[Velo Sim] Chamando obterPedido(${id}) - SIMULADA`);
  const pedido = mockPedidos.find(p => p._id === id);
  if (!pedido) {
    throw new Error(`Pedido com ID ${id} não encontrado (simulado).`);
  }
  // Simula busca de itens relacionados
  const itens = await veloListarItensDoPedido(id);
  return { ...pedido, itens }; 
};

// Função FALTANTE no backend real (simulada aqui)
export const veloCriarPedido = async (dados: any) => {
  await delay(900);
  console.log("[Velo Sim] Chamando criarPedido() com dados: - SIMULADA", dados);
  const novoPedido = {
    ...dados,
    _id: `ped-${Date.now()}`,
    numero: `P${new Date().getFullYear()}-${String(mockPedidos.length + 1).padStart(3, '0')}`,
    data: new Date().toISOString().split('T')[0],
    status: "Aguardando Pagamento", // Status inicial simulado
    valorTotal: 0, // Será atualizado ao adicionar itens
    itens: [],
    _createdDate: new Date(),
    _updatedDate: new Date(),
  };
  mockPedidos.push(novoPedido);
  return novoPedido;
};

// --- Itens do Pedido ---

export const veloListarItensDoPedido = async (pedidoId: string) => {
  await delay(200);
  console.log(`[Velo Sim] Chamando listarItensDoPedido(${pedidoId})`);
  return mockItensPedido.filter(item => item.pedidoId === pedidoId);
};

// Função FALTANTE no backend real (simulada aqui)
export const veloAdicionarItemPedido = async (pedidoId: string, dadosItem: any) => {
   await delay(700);
   console.log(`[Velo Sim] Chamando adicionarItemPedido(${pedidoId}) com dados: - SIMULADA`, dadosItem);
   const pedido = mockPedidos.find(p => p._id === pedidoId);
   if (!pedido) {
     throw new Error(`Pedido com ID ${pedidoId} não encontrado para adicionar item (simulado).`);
   }
   const produto = mockProdutos.find(p => p._id === dadosItem.produtoId);
   if (!produto) {
     throw new Error(`Produto com ID ${dadosItem.produtoId} não encontrado (simulado).`);
   }

   const novoItem = {
     _id: `item-${Date.now()}`,
     pedidoId: pedidoId,
     produtoId: dadosItem.produtoId,
     nomeProduto: produto.nome, // Adicionado para exibição
     quantidade: dadosItem.quantidade,
     valorUnitario: produto.precoBase, // Usando preço base do produto
     valorTotal: produto.precoBase * dadosItem.quantidade,
     _createdDate: new Date(),
     _updatedDate: new Date(),
   };
   mockItensPedido.push(novoItem);

   // Atualiza valor total do pedido (simulado)
   pedido.valorTotal = (pedido.valorTotal || 0) + novoItem.valorTotal;
   pedido._updatedDate = new Date();

   return novoItem;
};

// --- Ordens de Produção ---

export const veloListarOrdensProducao = async (statusId?: string) => {
  await delay(550);
  console.log(`[Velo Sim] Chamando listarOrdensProducao(${statusId || ''})`);
  if (statusId) {
    return mockOrdensProducao.filter(op => op.status === statusId);
  }
  return mockOrdensProducao;
};

// Função FALTANTE no backend real (simulada aqui)
export const veloObterOrdemProducao = async (id: string) => {
  await delay(350);
  console.log(`[Velo Sim] Chamando obterOrdemProducao(${id}) - SIMULADA`);
  const ordem = mockOrdensProducao.find(op => op._id === id);
  if (!ordem) {
    throw new Error(`Ordem de Produção com ID ${id} não encontrada (simulada).`);
  }
  return ordem;
};

// Adicione outras funções simuladas conforme necessário...
