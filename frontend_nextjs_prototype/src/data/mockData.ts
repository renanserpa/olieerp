// /src/data/mockData.ts

export interface Produto {
  id: string;
  nome: string;
  sku: string;
  preco: number;
  tempoProducaoEstimado: number | null; // em horas
}

export interface ItemPedido {
  id: string;
  pedidoId: string;
  produtoId: string; // Added productId
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
  precoTotal: number;
}

export interface Pedido {
  id: string;
  numero: string;
  clienteNome: string;
  dataPedido: string;
  status: string;
  valorTotal: number;
  itens: ItemPedido[];
}

export interface OrdemProducao {
  id: string;
  numeroOP: string;
  pedidoId: string;
  pedidoNumero: string;
  produtoId: string; // Added productId
  produtoNome: string;
  quantidade: number;
  status: string;
  dataCriacao: string;
  dataPrevista: string | null;
}

// Mock Data
const mockProdutos: Produto[] = [
    { id: "prod-001", nome: "Bolsa de Couro Média", sku: "BOL-MED-01", preco: 150.00, tempoProducaoEstimado: 8 },
    { id: "prod-002", nome: "Carteira Masculina", sku: "CART-MASC-01", preco: 80.00, tempoProducaoEstimado: 4 },
    { id: "prod-003", nome: "Cinto de Couro", sku: "CINTO-01", preco: 120.00, tempoProducaoEstimado: 3 },
    { id: "prod-004", nome: "Porta Cartão", sku: "PCART-01", preco: 95.00, tempoProducaoEstimado: 2 },
];

const mockPedidos: Pedido[] = [
  {
    id: "pedido-001",
    numero: "P2025-001",
    clienteNome: "Ana Silva",
    dataPedido: "2025-04-28",
    status: "Em Produção",
    valorTotal: 150.00,
    itens: [
      { id: "item-001a", pedidoId: "pedido-001", produtoId: "prod-001", produtoNome: "Bolsa de Couro Média", quantidade: 1, precoUnitario: 150.00, precoTotal: 150.00 },
    ],
  },
  {
    id: "pedido-002",
    numero: "P2025-002",
    clienteNome: "Bruno Costa",
    dataPedido: "2025-04-29",
    status: "Aguardando Produção",
    valorTotal: 280.00,
    itens: [
      { id: "item-002a", pedidoId: "pedido-002", produtoId: "prod-002", produtoNome: "Carteira Masculina", quantidade: 2, precoUnitario: 80.00, precoTotal: 160.00 },
      { id: "item-002b", pedidoId: "pedido-002", produtoId: "prod-003", produtoNome: "Cinto de Couro", quantidade: 1, precoUnitario: 120.00, precoTotal: 120.00 },
    ],
  },
  {
    id: "pedido-003",
    numero: "P2025-003",
    clienteNome: "Carla Dias",
    dataPedido: "2025-04-30",
    status: "Concluído",
    valorTotal: 95.00,
    itens: [
      { id: "item-003a", pedidoId: "pedido-003", produtoId: "prod-004", produtoNome: "Porta Cartão", quantidade: 1, precoUnitario: 95.00, precoTotal: 95.00 },
    ],
  },
];

const mockOrdensProducao: OrdemProducao[] = [
  {
    id: "op-001",
    numeroOP: "OP-001",
    pedidoId: "pedido-001",
    pedidoNumero: "P2025-001",
    produtoId: "prod-001",
    produtoNome: "Bolsa de Couro Média",
    quantidade: 1,
    status: "Corte",
    dataCriacao: "2025-04-28",
    dataPrevista: "2025-05-05",
  },
  {
    id: "op-002",
    numeroOP: "OP-002",
    pedidoId: "pedido-002",
    pedidoNumero: "P2025-002",
    produtoId: "prod-002",
    produtoNome: "Carteira Masculina",
    quantidade: 2,
    status: "Aguardando Início",
    dataCriacao: "2025-04-29",
    dataPrevista: "2025-05-06",
  },
   {
    id: "op-003",
    numeroOP: "OP-003",
    pedidoId: "pedido-002",
    pedidoNumero: "P2025-002",
    produtoId: "prod-003",
    produtoNome: "Cinto de Couro",
    quantidade: 1,
    status: "Aguardando Início",
    dataCriacao: "2025-04-29",
    dataPrevista: "2025-05-06",
  },
   {
    id: "op-004",
    numeroOP: "OP-004",
    pedidoId: "pedido-003",
    pedidoNumero: "P2025-003",
    produtoId: "prod-004",
    produtoNome: "Porta Cartão",
    quantidade: 1,
    status: "Concluído",
    dataCriacao: "2025-04-30",
    dataPrevista: null,
  },
];

// Simulate fetching data
export const getProdutos = async (): Promise<Produto[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockProdutos;
};

export const getProdutoById = async (id: string): Promise<Produto | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockProdutos.find(p => p.id === id);
};

export const getPedidos = async (): Promise<Pedido[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockPedidos;
};

export const getPedidoById = async (id: string): Promise<Pedido | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockPedidos.find(p => p.id === id);
};

export const getOrdensProducao = async (): Promise<OrdemProducao[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  return mockOrdensProducao;
};

export const getOrdemProducaoById = async (id: string): Promise<OrdemProducao | undefined> => {
  await new Promise(resolve => setTimeout(resolve, 50));
  return mockOrdensProducao.find(op => op.id === id);
};

// Simulate creating data (adds to mock array, no real persistence)
export const createProduto = async (newProdutoData: Omit<Produto, 'id'>): Promise<Produto> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const newId = `prod-${String(mockProdutos.length + 1).padStart(3, '0')}`;
    const produto: Produto = {
        ...newProdutoData,
        id: newId,
    };
    mockProdutos.push(produto);
    console.log("Produto criado (mock):", produto);
    return produto;
};

export const createPedido = async (newPedidoData: Omit<Pedido, 'id' | 'itens' | 'valorTotal' | 'status' | 'dataPedido' | 'numero'>): Promise<Pedido> => {
    await new Promise(resolve => setTimeout(resolve, 150));
    const newId = `pedido-${String(mockPedidos.length + 1).padStart(3, '0')}`;
    const newNumero = `P${new Date().getFullYear()}-${String(mockPedidos.length + 1).padStart(3, '0')}`;
    const pedido: Pedido = {
        ...newPedidoData,
        id: newId,
        numero: newNumero,
        dataPedido: new Date().toISOString().split('T')[0], // Set current date
        status: 'Novo', // Default status
        valorTotal: 0, // Will be calculated based on items
        itens: [],
    };
    mockPedidos.push(pedido);
    console.log("Pedido criado (mock):", pedido);
    return pedido;
};

// Add more mock functions as needed (e.g., updatePedido, createItemPedido, etc.)

