// /src/app/produtos/novo/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Use next/navigation for App Router
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { veloSalvarProduto } from "@/lib/velo-sim"; // Remove simulated Velo function import
import wixClient from "@/lib/wixClient"; // Import the configured Wix client

export default function NovoProdutoPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [sku, setSku] = useState("");
  const [preco, setPreco] = useState("");
  const [tempoProducao, setTempoProducao] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const precoNum = parseFloat(preco);
    const tempoProdNum = tempoProducao ? parseInt(tempoProducao, 10) : undefined; // Use undefined if empty

    // Adjust field names to match backend expectations (e.g., precoBase)
    const dadosProduto = {
        nome: nome,
        // sku: sku, // Assuming SKU is handled by backend or not needed for creation yet
        precoBase: precoNum,
        tempoProducaoEstimado: tempoProdNum,
        // Add other fields as needed by your backend function
    };

    // Basic validation (can be enhanced)
    if (!dadosProduto.nome || isNaN(dadosProduto.precoBase) || dadosProduto.precoBase <= 0) {
      setError("Por favor, preencha o Nome e um Preço Base válido.");
      setIsSubmitting(false);
      return;
    }
    if (dadosProduto.tempoProducaoEstimado !== undefined && (isNaN(dadosProduto.tempoProducaoEstimado) || dadosProduto.tempoProducaoEstimado < 0)) {
        setError("Tempo de produção deve ser um número positivo ou vazio.");
        setIsSubmitting(false);
        return;
    }


    try {      // Construct the relative path for the HTTP function
      const functionPath = '/_functions/produto'; // Corrected path
      
      // Make the fetch call using wixClient
      const response = await wixClient.fetch(functionPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosProduto), // Send data in the request body
      });

      if (!response.ok) {
        let errorBody = 'Unknown error';
        try {
          const errorJson = await response.json();
          errorBody = errorJson.error || JSON.stringify(errorJson);
        } catch (parseError) {
          // Ignore if response body is not JSON or empty
        }
        throw new Error(`HTTP error ${response.status}: ${errorBody}`);
      }

      // Optionally, you can get the created product data from the response if needed
      // const novoProdutoCriado = await response.json();
      // console.log("Produto criado:", novoProdutoCriado);

      // Redirect to the product list page after successful creation
      router.push("/produtos");

    } catch (err: any) {
      console.error("Erro ao criar produto (Wix SDK):", err);
      setError(err.message || "Ocorreu um erro ao tentar criar o produto.");
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Novo Produto</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="nome">Nome do Produto</Label>
          <Input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>
        {/* Keep SKU for now, but it might not be sent directly if backend generates it */}
        <div>
          <Label htmlFor="sku">SKU (Referência)</Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Ex: BOL-MED-01"
          />
        </div>
        <div>
          <Label htmlFor="preco">Preço Base (R$)</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            min="0.01"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="tempoProducao">Tempo de Produção Estimado (horas)</Label>
          <Input
            id="tempoProducao"
            type="number"
            min="0"
            value={tempoProducao}
            onChange={(e) => setTempoProducao(e.target.value)}
            placeholder="Opcional"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Salvar Produto"}
        </Button>
      </form>
    </div>
  );
}
