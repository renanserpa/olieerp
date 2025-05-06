// /src/app/produtos/page.tsx
"use client"; // Required for useState, useEffect

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import { veloListarProdutos } from "@/lib/velo-sim"; // Remove simulated Velo function import
import wixClient from "@/lib/wixClient"; // Import the configured Wix client
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export default function ProdutosListPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct the relative path for the HTTP function
        const functionPath = 
'/_functions/produtos'; // Corrected path - removed extra newline
        // Make the fetch call using wixClient
        const response = await wixClient.fetch(functionPath, {
          method: 'GET',
          // TODO: Add query parameters if needed, e.g., for limit
          // params: { limit: 50 } // Check SDK docs for how to pass query params
        });

        if (!response.ok) {
          // Try to get error details from the response body
          let errorBody = 'Unknown error';
          try {
            const errorJson: unknown = await response.json(); // Type as unknown
            // Safely check for error property
            if (typeof errorJson === 'object' && errorJson !== null && 'error' in errorJson && typeof (errorJson as any).error === 'string') {
              errorBody = (errorJson as { error: string }).error;
            } else {
              errorBody = JSON.stringify(errorJson);
            }
          } catch (parseError) {
            // Ignore if response body is not JSON or empty
          }
          throw new Error(`HTTP error ${response.status}: ${errorBody}`);
        }

        const data: unknown = await response.json();
        // Assuming the backend returns an array of products directly in the body
        // Type assertion to ensure data matches the Produto[] type before setting state
        setProdutos(data as Produto[]); 

      } catch (err: any) {
        console.error("Erro ao buscar produtos (Wix SDK):", err);
        setError(`Falha ao carregar produtos: ${err.message}. Tente novamente mais tarde.`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lista de Produtos</h1>
        <Button asChild>
          <Link href="/produtos/novo">Novo Produto</Link>
        </Button>
      </div>

      {loading && <p>Carregando produtos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="border rounded-lg">
          <Table>
            <TableCaption>Uma lista dos produtos cadastrados.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">SKU</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-right">Preço Base (R$)</TableHead>
                <TableHead className="text-right">Tempo Prod. (h)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto._id}> {/* Use _id from backend */} 
                  <TableCell className="font-medium">{produto.sku ?? "-"}</TableCell>
                  <TableCell>{produto.nome}</TableCell>
                  <TableCell className="text-right">{produto.precoBase?.toFixed(2) ?? "-"}</TableCell>
                  <TableCell className="text-right">{produto.tempoProducaoEstimado ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                       <Link href={`/produtos/${produto._id}`}>Detalhes</Link> {/* Use _id */} 
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

