// /src/app/pedidos/page.tsx
"use client"; // Required for useState, useEffect

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
// import { getPedidos, Pedido } from "@/data/mockData"; // Remove mock data import
import { veloListarPedidosRecentes } from "@/lib/velo-sim"; // Import simulated Velo function
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define a basic type for Pedido based on velo-sim return (which uses mockData with 'id')
// TODO: Refine this type based on actual backend function return
type Pedido = {
  id: string; // Changed from _id to match mockData/velo-sim
  numero?: string; // Assuming numero might exist
  clienteNome?: string; // Assuming clienteNome might exist
  data?: string; // Assuming data might exist
  status?: string;
  valorTotal?: number;
  // Add other relevant fields from your actual data structure
};

export default function PedidosListPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use simulated Velo function which returns Pedido[] with 'id'
        const data = await veloListarPedidosRecentes();
        // Type should now match
        setPedidos(data);
      } catch (err: any) {
        console.error("Erro ao buscar pedidos (simulado):", err);
        setError("Falha ao carregar pedidos. Tente novamente mais tarde.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Lista de Pedidos</h1>
        <Button asChild>
          <Link href="/pedidos/novo">Novo Pedido</Link>
        </Button>
      </div>

      {loading && <p>Carregando pedidos...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && (
        <div className="border rounded-lg">
          <Table>
            <TableCaption>Uma lista dos pedidos recentes.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Número</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor Total (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pedidos.map((pedido) => (
                <TableRow key={pedido.id}> {/* Use id */} 
                  <TableCell className="font-medium">{pedido.numero ?? "-"}</TableCell>
                  <TableCell>{pedido.clienteNome ?? "-"}</TableCell>
                  <TableCell>{pedido.data ? new Date(pedido.data).toLocaleDateString("pt-BR") : "-"}</TableCell> {/* Format date */} 
                  <TableCell>{pedido.status ?? "-"}</TableCell>
                  <TableCell className="text-right">{pedido.valorTotal?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                       <Link href={`/pedidos/${pedido.id}`}>Detalhes</Link> {/* Use id */} 
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

