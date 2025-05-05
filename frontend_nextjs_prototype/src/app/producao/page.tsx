// /src/app/producao/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import { getOrdensProducao, OrdemProducao } from "@/data/mockData"; // Remove mock data import
import { veloListarOrdensProducao } from "@/lib/velo-sim"; // Import simulated Velo function
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define a basic type for OrdemProducao based on velo-sim return for now
// TODO: Refine this type based on actual backend function return
type OrdemProducao = {
  _id: string;
  numeroOP?: string;
  pedidoNumero?: string; // Assuming this comes from related Pedido
  produtoNome?: string; // Assuming this comes from related Produto
  quantidade?: number;
  status?: string;
  dataCriacao?: string;
  dataPrevista?: string;
  // Add other relevant fields from your actual data structure
};

export default function ProducaoListPage() {
  const [ordens, setOrdens] = useState<OrdemProducao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // const data = await getOrdensProducao(); // Use simulated Velo function
        const data = await veloListarOrdensProducao();
        setOrdens(data);
      } catch (err: any) {
        console.error("Erro ao buscar ordens de produção (simulado):", err);
        setError("Falha ao carregar ordens de produção. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Ordens de Produção</h1>
        {/* Button for manual creation might be added later if needed */}
      </div>

      {loading && <p>Carregando ordens de produção...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="border rounded-lg">
          <Table>
            <TableCaption>Uma lista das ordens de produção.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Número OP</TableHead>
                <TableHead>Pedido</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead>Data Prevista</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordens.map((ordem) => (
                <TableRow key={ordem._id}> {/* Use _id */} 
                  <TableCell className="font-medium">{ordem.numeroOP ?? "-"}</TableCell>
                  <TableCell>{ordem.pedidoNumero ?? "-"}</TableCell> {/* Assuming pedidoNumero exists */} 
                  <TableCell>{ordem.produtoNome ?? "-"}</TableCell> {/* Assuming produtoNome exists */} 
                  <TableCell className="text-right">{ordem.quantidade ?? 0}</TableCell>
                  <TableCell>{ordem.status ?? "-"}</TableCell>
                  <TableCell>{ordem.dataCriacao ? new Date(ordem.dataCriacao).toLocaleDateString("pt-BR") : "-"}</TableCell> {/* Format date */} 
                  <TableCell>{ordem.dataPrevista ? new Date(ordem.dataPrevista).toLocaleDateString("pt-BR") : "-"}</TableCell> {/* Format date */} 
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                       <Link href={`/producao/${ordem._id}`}>Detalhes</Link> {/* Use _id */} 
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
