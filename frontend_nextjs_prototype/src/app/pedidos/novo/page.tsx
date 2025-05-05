// /src/app/pedidos/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { createPedido } from "@/data/mockData"; // Remove mock data import
import { veloCriarPedido } from "@/lib/velo-sim"; // Import simulated Velo function

export default function NovoPedidoPage() {
  const router = useRouter();
  const [clienteNome, setClienteNome] = useState("");
  // Add state for other relevant fields if needed (e.g., canalVendaId)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!clienteNome) {
      setError("Por favor, preencha o nome do cliente.");
      setIsSubmitting(false);
      return;
    }

    const dadosPedido = {
        clienteNome: clienteNome,
        // Add other fields expected by veloCriarPedido (or the real backend function)
        // e.g., canalVendaId: "site", 
    };

    try {
      // Create the basic order (without items for now)
      // const novoPedido = await createPedido({ clienteNome }); // Use simulated Velo function
      const novoPedido = await veloCriarPedido(dadosPedido);

      // Redirect to the order detail page to add items
      router.push(`/pedidos/${novoPedido._id}`); // Use _id from backend response
    } catch (err: any) {
      console.error("Erro ao criar pedido (simulado):", err);
      setError(err.message || "Ocorreu um erro ao tentar criar o pedido.");
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Novo Pedido</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="clienteNome">Nome do Cliente</Label>
          <Input
            id="clienteNome"
            value={clienteNome}
            onChange={(e) => setClienteNome(e.target.value)}
            required
          />
        </div>
        {/* Add inputs for other fields if needed */}

        <div className="border rounded-lg p-4 mt-4 bg-gray-50">
            <p className="text-gray-500 text-sm">A adição de itens será feita na próxima tela, após salvar os dados básicos do pedido.</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Pedido e Adicionar Itens"}
        </Button>
      </form>
    </div>
  );
}
