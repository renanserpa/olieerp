// /src/lib/velo-sim.ts
// Simula as chamadas para as funções de backend do Velo

// Import the functions that return the mock data, not the constants themselves
import {
  getProdutos,
  getProdutoById,
  createProduto, // Assuming createProduto exists and manipulates the underlying (unexported) array
  getPedidos,
  getPedidoById,
  createPedido, // Assuming createPedido exists
  getOrdensProducao,
  getOrdemProducaoById,
  // We need a function to get items for a specific order, let's assume one exists or add it
  // For now, let's assume getPedidoById returns items or we filter manually if needed
  // Let's also assume functions for adding/creating items exist if needed by the simulation logic
  Produto, // Import interfaces if needed
  Pedido,
  OrdemProducao,
  ItemPedido
} from "../data/mockData";

// Simula um atraso de rede
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Produtos --- 

export const veloListarProdutos = async () => {
  await delay(500); // Simula atraso
  console.log("[Velo Sim] Chamando listarProdutos()");
  return await getProdutos(); // Use the exported function
};

export const veloObterProduto = async (id: string) => {
  await delay(300);
  console.log(`[Velo Sim] Chamando obterProduto(${id})`);
  const produto = await getProdutoById(id); // Use the exported function
  if (!produto) {
    throw new Error(`Produto com ID ${id} não encontrado (simulado).`);
  }
  return produto;
};

export const veloSalvarProduto = async (dados: Omit<Produto, 'id'> & { _id?: string }) => {
  await delay(800);
  console.log("[Velo Sim] Chamando salvarProduto() com dados:", dados);
  if (dados._id) {
    // Simula atualização - mockData.ts doesn't export update functions, so this is purely simulation
    console.warn("[Velo Sim] Update simulation might not persist in mockData.ts");
    const existingProducts = await getProdutos();
    const index = existingProducts.findIndex(p => p.id === dados._id);
    if (index > -1) {
      // This update won't actually modify the source array in mockData.ts unless we add update functions there
      const updatedProduct = { ...existingProducts[index], ...dados, _updatedDate: new Date() };
      return updatedProduct;
    }
    throw new Error(`Produto com ID ${dados._id} não encontrado para atualizar (simulado).`);
  } else {
    // Simula inserção using the exported create function
    // Ensure the input 'dados' matches the expected type for createProduto
    const { _id, ...rest } = dados; // Remove potential _id from input
    return await createProduto(rest as Omit<Produto, 'id'>); // Use the exported function
  }
};

// --- Pedidos ---

export const veloListarPedidosRecentes = async (limit = 50) => {
  await delay(600);
  console.log(`[Velo Sim] Chamando listarPedidosRecentes(${limit})`);
  const pedidos = await getPedidos(); // Use the exported function
  return pedidos.slice(0, limit);
};

export const veloObterPedido = async (id: string) => {
  await delay(400);
  console.log(`[Velo Sim] Chamando obterPedido(${id}) - SIMULADA`);
  const pedido = await getPedidoById(id); // Use the exported function
  if (!pedido) {
    throw new Error(`Pedido com ID ${id} não encontrado (simulado).`);
  }
  // getPedidoById in mockData.ts already includes items based on its structure
  return pedido;
};

export const veloCriarPedido = async (dados: Omit<Pedido, 'id' | 'itens' | 'valorTotal' | 'status' | 'dataPedido' | 'numero'>) => {
  await delay(900);
  console.log("[Velo Sim] Chamando criarPedido() com dados: - SIMULADA", dados);
  // Use the exported function from mockData.ts
  return await createPedido(dados);
};

// --- Itens do Pedido ---
// mockData.ts doesn't export a function specifically for listing items of *one* order.
// We'll get the order and return its items.
export const veloListarItensDoPedido = async (pedidoId: string): Promise<ItemPedido[]> => {
  await delay(200);
  console.log(`[Velo Sim] Chamando listarItensDoPedido(${pedidoId})`);
  const pedido = await getPedidoById(pedidoId);
  if (!pedido) {
    throw new Error(`Pedido com ID ${pedidoId} não encontrado para listar itens (simulado).`);
  }
  return pedido.itens || [];
};

// Function to add item - mockData.ts doesn't export this, simulation only
export const veloAdicionarItemPedido = async (pedidoId: string, dadosItem: { produtoId: string; quantidade: number }): Promise<ItemPedido> => {
   await delay(700);
   console.log(`[Velo Sim] Chamando adicionarItemPedido(${pedidoId}) com dados: - SIMULADA`, dadosItem);
   console.warn("[Velo Sim] Add item simulation might not persist in mockData.ts");

   const pedido = await getPedidoById(pedidoId);
   if (!pedido) {
     throw new Error(`Pedido com ID ${pedidoId} não encontrado para adicionar item (simulado).`);
   }
   const produto = await getProdutoById(dadosItem.produtoId);
   if (!produto) {
     throw new Error(`Produto com ID ${dadosItem.produtoId} não encontrado (simulado).`);
   }

   const novoItem: ItemPedido = {
     id: `item-${Date.now()}`,
     pedidoId: pedidoId,
     produtoId: dadosItem.produtoId,
     produtoNome: produto.nome,
     quantidade: dadosItem.quantidade,
     precoUnitario: produto.preco, // Using price from product
     precoTotal: produto.preco * dadosItem.quantidade,
     // _createdDate and _updatedDate are not in the interface, omitting
   };

   // This update won't actually modify the source array in mockData.ts
   // pedido.itens.push(novoItem);
   // pedido.valorTotal = (pedido.valorTotal || 0) + novoItem.precoTotal;

   return novoItem;
};

// --- Ordens de Produção ---

export const veloListarOrdensProducao = async (status?: string) => {
  await delay(550);
  console.log(`[Velo Sim] Chamando listarOrdensProducao(${status || ''})`);
  const ordens = await getOrdensProducao(); // Use the exported function
  if (status) {
    return ordens.filter(op => op.status === status);
  }
  return ordens;
};

export const veloObterOrdemProducao = async (id: string) => {
  await delay(350);
  console.log(`[Velo Sim] Chamando obterOrdemProducao(${id}) - SIMULADA`);
  const ordem = await getOrdemProducaoById(id); // Use the exported function
  if (!ordem) {
    throw new Error(`Ordem de Produção com ID ${id} não encontrada (simulada).`);
  }
  return ordem;
};

// Adicione outras funções simuladas conforme necessário...

