"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProdutosTable from "./_components/ProdutosTable";

export default function ProdutosPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Produtos</h1>
        <Button className="bg-olie-primary hover:bg-olie-primary/90">
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <ProdutosTable />
        </CardContent>
      </Card>
    </div>
  );
}
