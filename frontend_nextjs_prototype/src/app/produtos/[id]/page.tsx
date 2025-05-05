// /src/app/produtos/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Use next/navigation for App Router
// import { veloObterProduto } from "@/lib/velo-sim"; // Remove simulated Velo function import
import wixClient from "@/lib/wixClient"; // Import the configured Wix client
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define a basic type for Produto based on velo-sim return for now
// TODO: Refine this type based on actual backend function return
type Produto = {
  _id: string;
  sku?: string; // Assuming SKU might exist or be added
  nome: string;
  precoBase?: number; // Assuming price might be precoBase
  tempoProducaoEstimado?: number;
  // Add other relevant fields from your actual data structure
};

export default function ProdutoDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
      try {
        // Construct the relative path for the HTTP function, including the ID
        const functionPath = `/_functions/produto/${id}`;
        
        // Make the fetch call using wixClient
        const response = await wixClient.fetch(functionPath, {
          method: 'GET',
        });

        if (!response.ok) {
          let errorBody = 'Unknown error';
          try {
            const errorJson = await response.json();
            errorBody = errorJson.error || JSON.stringify(errorJson);
          } catch (parseError) {
            // Ignore if response body is not JSON or empty
          }
          // Handle 404 specifically
          if (response.status === 404) {
             setError("Produto não encontrado.");
          } else {
             throw new Error(`HTTP error ${response.status}: ${errorBody}`);
          }
        } else {
          const data = await response.json();
          // Assuming the backend returns the product object directly in the body
          // If it returns { body: {...} }, adjust accordingly: const product = data.body;
          setProduto(data); // Adjust if needed based on actual response structure
        }

      } catch (err: any) {
        console.error(`Erro ao buscar produto ${id} (Wix SDK):`, err);
        // Set error state only if it wasn't already set (e.g., for 404)
        if (!error) {
          setError(err.message || "Ocorreu um erro ao buscar os detalhes do produto.");
        }
      } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [id]);

  if (loading) {
    return <p>Carregando detalhes do produto...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!produto) {
    // This case might be redundant if error state always catches not found
    return <p>Produto não encontrado.</p>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Detalhes do Produto: {produto.nome}</h1>
          {/* Add Edit button later if needed */}
          {/* <Button variant="outline">Editar</Button> */}
      </div>

      <div className="space-y-2 border rounded-lg p-4">
          <p><strong>ID:</strong> {produto._id}</p> {/* Display _id */} 
          <p><strong>SKU:</strong> {produto.sku ?? "-"}</p>
          <p><strong>Nome:</strong> {produto.nome}</p>
          <p><strong>Preço Base:</strong> R$ {produto.precoBase?.toFixed(2) ?? "-"}</p> {/* Use precoBase */} 
          <p><strong>Tempo de Produção Estimado:</strong> {produto.tempoProducaoEstimado ? `${produto.tempoProducaoEstimado} horas` : "Não definido"}</p>
      </div>

       <Button variant="outline" className="mt-4" asChild>
           <Link href="/produtos">Voltar para Lista</Link>
       </Button>
    </div>
  );
}
