// /src/app/estoque/materiais/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
// import wixClient from "@/lib/wixClient"; // No longer needed for API calls here
import { listarMateriaisBasicos, obterEstoqueDoInsumo } from "@/lib/api"; // Import API functions
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";

// Define type based on backend materiaisBasicos.js
type MaterialBasico = {
  _id: string;
  nome: string;
  codigo?: string;
  grupoId?: any; // Could be string ID or object if included
  unidadeMedida?: string;
  precoUnitario?: number;
  ativo?: boolean;
  dataCriacao?: string | Date;
  ultimaAtualizacao?: string | Date;
  // Add field for stock level
  saldoAtual?: number | null;
};

// Define type for stock level based on estoqueDeInsumos.js
type EstoqueInsumo = {
  _id: string;
  insumoId: string;
  quantidadeAtual: number;
  // Add other fields if needed
};

export default function MateriaisListPage() {
  const [materiais, setMateriais] = useState<MaterialBasico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch materials list using the new API function
      const materiaisData: MaterialBasico[] = await listarMateriaisBasicos();

      if (!materiaisData || materiaisData.length === 0) {
        setMateriais([]);
        setLoading(false);
        return;
      }

      // Initialize materials with placeholder stock
      let materiaisComSaldo: MaterialBasico[] = materiaisData.map((mat) => ({ ...mat, saldoAtual: null }));
      setMateriais(materiaisComSaldo); // Set initial state with placeholders

      // Fetch stock levels for each material using the new API function
      // TODO: Optimize this - ideally, create a backend function to fetch materials WITH stock levels
      const stockPromises = materiaisData.map(mat =>
        obterEstoqueDoInsumo(mat._id)
          .catch(err => {
            console.warn(`Could not fetch stock for material ${mat._id}:`, err); // Log warning but don't fail all
            return null; // Return null if fetching stock fails for one item
          })
      );
      const stockResults: (EstoqueInsumo | null)[] = await Promise.all(stockPromises);

      // Create a map for quick stock lookup
      const stockMap = new Map<string, number>();
      stockResults.forEach(stock => {
        // The API returns the stock object directly, not wrapped
        if (stock && stock.insumoId) { // Check if stock and insumoId exist
          stockMap.set(stock.insumoId, stock.quantidadeAtual);
        }
      });

      // Update materials state with actual stock levels
      materiaisComSaldo = materiaisData.map((mat) => ({
        ...mat,
        saldoAtual: stockMap.get(mat._id) ?? 0, // Use 0 if stock record not found
      }));
      setMateriais(materiaisComSaldo);

    } catch (err: any) {
      console.error("Erro ao buscar materiais básicos ou estoque:", err);
      setError(`Falha ao carregar dados: ${err.message || "Erro desconhecido"}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Materiais Básicos</h1>
        <Button asChild>
          <Link href="/estoque/materiais/novo">
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Material
          </Link>
        </Button>
      </div>

      {error && <p className="text-red-600 bg-red-100 border border-red-400 p-4 rounded mb-4">{error}</p>}

      <div className="border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableCaption>Lista de materiais básicos cadastrados no sistema.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Saldo Atual</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-[80px]" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-[80px]" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-8 w-[80px]" /></TableCell>
                </TableRow>
              ))
            ) : materiais.length === 0 && !error ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24">Nenhum material encontrado.</TableCell>
              </TableRow>
            ) : (
              materiais.map((material) => (
                <TableRow key={material._id}>
                  <TableCell className="font-mono text-xs">{material.codigo ?? "-"}</TableCell>
                  <TableCell className="font-semibold">{material.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{material.unidadeMedida ?? "-"}</TableCell>
                  <TableCell className="text-right font-medium">
                    {material.saldoAtual !== null ? material.saldoAtual : <span className="text-muted-foreground text-xs">N/A</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={material.ativo ? "default" : "destructive"}>
                      {material.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/estoque/materiais/${material._id}`}>Detalhes</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

