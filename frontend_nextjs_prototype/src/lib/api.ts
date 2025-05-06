// Base URL for Velo HTTP Functions (Replace with your actual site URL)
// It's better to use environment variables for this in a real application
const BASE_URL = process.env.NEXT_PUBLIC_WIX_SITE_URL || "https://manusaimanusai.wixstudio.io/olie-erp"; // Replace with your site URL
const API_PREFIX = "/_functions";

/**
 * Generic function to call Velo HTTP Functions.
 * Handles POST requests by default, assuming data is passed in the body.
 * TODO: Add proper authentication handling (passing Wix session token if needed).
 * TODO: Add more robust error handling.
 *
 * @param modulePath The path to the backend module (e.g., "estoque/materiaisBasicos")
 * @param functionName The name of the function to execute (e.g., "listarMateriaisBasicos")
 * @param args Arguments to pass to the backend function (will be stringified in the body)
 * @returns Promise<any> The result from the backend function
 */
export async function callVeloApi(modulePath: string, functionName: string, args?: any): Promise<any> {
  const url = `${BASE_URL}${API_PREFIX}/${modulePath}/${functionName}`;

  console.log(`Calling Velo API: ${url} with args:`, args);

  try {
    const response = await fetch(url, {
      method: "POST", // Velo http-functions often use POST even for GET-like operations
      headers: {
        "Content-Type": "application/json",
        // Add Authorization header if needed, e.g., using Wix session token
        // "Authorization": `Bearer ${wixSessionToken}`
      },
      body: args ? JSON.stringify(args) : undefined,
    });

    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = await response.text();
      }
      console.error("Velo API Error Response:", errorBody);
      throw new Error(`HTTP error ${response.status}: ${response.statusText} - ${JSON.stringify(errorBody)}`);
    }

    const data = await response.json();
    console.log(`Velo API Success Response for ${functionName}:`, data);
    return data;

  } catch (error) {
    console.error(`Error calling Velo function ${modulePath}/${functionName}:`, error);
    // Re-throw the error so calling components can handle it (e.g., show toast)
    throw error;
  }
}

// Example specific function (optional, but good practice)
export const listarMateriaisBasicos = () => callVeloApi("estoque/materiaisBasicos", "listarMateriaisBasicos");
export const obterMaterialBasicoPorId = (id: string) => callVeloApi("estoque/materiaisBasicos", "obterMaterialBasicoPorId", { id });
export const criarMaterialBasico = (data: any) => callVeloApi("estoque/materiaisBasicos", "criarMaterialBasico", data);
export const atualizarMaterialBasico = (id: string, data: any) => callVeloApi("estoque/materiaisBasicos", "atualizarMaterialBasico", { _id: id, ...data });

export const obterEstoqueDoInsumo = (insumoId: string) => callVeloApi("estoque/estoqueDeInsumos", "obterEstoqueDoInsumo", { insumoId });
export const listarMovimentacoesDoInsumo = (insumoId: string) => callVeloApi("estoque/movimentacoesEstoque", "listarMovimentacoesDoInsumo", { insumoId });
export const registrarEntradaManual = (data: any) => callVeloApi("estoque/movimentacoesEstoque", "registrarEntradaManual", data);
export const registrarSaidaManual = (data: any) => callVeloApi("estoque/movimentacoesEstoque", "registrarSaidaManual", data);

export const listarPedidos = () => callVeloApi("pedidos/pedidos", "listarPedidos");
export const obterPedidoPorId = (id: string) => callVeloApi("pedidos/pedidos", "obterPedidoPorId", { id });

export const listarOrdensProducao = () => callVeloApi("producao/ordensProducao", "listarOrdensProducao");
export const obterOrdemProducaoPorId = (id: string) => callVeloApi("producao/ordensProducao", "obterOrdemProducaoPorId", { id });
export const atualizarStatusOrdemProducao = (id: string, novoStatus: string) => callVeloApi("producao/ordensProducao", "atualizarStatusOrdemProducao", { _id: id, novoStatus });

// Add other API functions as needed...



// Dashboard specific functions (assuming backend structure)
export const obterResumoDashboard = () => callVeloApi("dashboard/resumos", "obterResumoDashboard");
export const listarProdutosRecentes = (limit: number = 5) => callVeloApi("produtos/produtos", "listarProdutos", { limit: limit, sort: { field: "_createdDate", order: "desc" } });
export const listarMateriaisEstoqueBaixo = () => callVeloApi("estoque/estoqueDeInsumos", "listarMateriaisEstoqueBaixo");

