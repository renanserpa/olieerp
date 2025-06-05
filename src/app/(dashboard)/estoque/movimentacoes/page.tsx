"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Download, Upload } from "lucide-react"; // Add icons for import/export
import { DataTable } from "@/components/ui/data-table";
import { movementColumns, type StockMovement } from "./_components/MovementColumns"; // Import real columns and type
import { MovementForm } from "./_components/MovementForm"; // Import real form
import { createSupabaseServerClientAlternative } from "@/lib/supabase/server-alternative"; // Keep for potential server-side fetches
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Fetch real movement data from Supabase (Placeholder)
async function getMovements(): Promise<StockMovement[]> {
  console.log("Fetching stock movements...");
  // Example structure matching potential columns
  return [
    { id: 'uuid-mov-1', item_id: 'uuid-item-1', item_name: 'Insumo Principal X', type: 'Entrada', quantity: 100, location_to_id: 'uuid-loc-1', location_to_name: 'Almoxarifado Principal', user_id: 'user-1', user_name: 'Admin', related_document_id: 'PO-001', created_at: new Date().toISOString() },
    { id: 'uuid-mov-2', item_id: 'uuid-item-2', item_name: 'Componente Y', type: 'Saída', quantity: 50, location_from_id: 'uuid-loc-2', location_from_name: 'Estoque Loja A', user_id: 'user-2', user_name: 'Vendedor A', related_document_id: 'SO-001', created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 'uuid-mov-3', item_id: 'uuid-item-1', item_name: 'Insumo Principal X', type: 'Ajuste Saída', quantity: 5.5, location_from_id: 'uuid-loc-1', location_from_name: 'Almoxarifado Principal', user_id: 'user-1', user_name: 'Admin', reason: 'Perda por avaria', created_at: new Date(Date.now() - 7200000).toISOString() },
    { id: 'uuid-mov-4', item_id: 'uuid-item-2', item_name: 'Componente Y', type: 'Transferência', quantity: 20, location_from_id: 'uuid-loc-2', location_from_name: 'Estoque Loja A', location_to_id: 'uuid-loc-1', location_to_name: 'Almoxarifado Principal', user_id: 'user-3', user_name: 'Logística', reason: 'Reposição', created_at: new Date(Date.now() - 10800000).toISOString() },

  ];
  /* Replace with actual Supabase fetch:
  const supabase = createSupabaseServerClientAlternative();
  const { data, error } = await supabase
    .from('stock_movements') // Assuming table name
    .select(`
      id,
      item_id,
      item:stock_items ( name ),
      type,
      quantity,
      location_from_id,
      location_from:stock_locations!location_from_id ( name ),
      location_to_id,
      location_to:stock_locations!location_to_id ( name ),
      user_id,
      user:users ( name ), // Assuming a users table
      reason,
      related_document_id,
      created_at
    `)
    .order('created_at', { ascending: false }); // Order by most recent

  if (error) {
    console.error("Error fetching movements:", error);
    return [];
  }

  const mappedData = data?.map(item => ({
    id: item.id,
    item_id: item.item_id,
    item_name: (item.item as { name: string })?.name || 'Item Desconhecido',
    type: item.type,
    quantity: item.quantity,
    location_from_id: item.location_from_id,
    location_from_name: (item.location_from as { name: string })?.name,
    location_to_id: item.location_to_id,
    location_to_name: (item.location_to as { name: string })?.name,
    user_id: item.user_id,
    user_name: (item.user as { name: string })?.name || 'Usuário Desconhecido',
    reason: item.reason,
    related_document_id: item.related_document_id,
    created_at: item.created_at,
  })) || [];

  return mappedData;
  */
}

export default function MovimentacoesEstoquePage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [movements, setMovements] = React.useState<StockMovement[]>([]);
  // Editing movements is generally not recommended, focus on creation and viewing

  const fetchAndSetMovements = () => {
    getMovements().then(setMovements);
  };

  React.useEffect(() => {
    fetchAndSetMovements();
  }, []);

  const handleSuccess = () => {
    setIsFormOpen(false);
    fetchAndSetMovements();
    // TODO: Add toast notification for success
  };

  // Placeholder functions for import/export
  const handleExport = () => {
    alert("Exportar CSV (placeholder)");
    // TODO: Implement CSV export logic
  };
  const handleImport = () => {
    alert("Importar CSV (placeholder)");
    // TODO: Implement CSV import logic (likely needs a dedicated modal/page)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Histórico de Movimentações de Estoque</h1>
        <div className="flex items-center gap-2">
          {/* Import/Export Buttons (Placeholders) */}
          <Button variant="outline" onClick={handleImport} disabled>
            <Upload className="mr-2 h-4 w-4" /> Importar
          </Button>
          <Button variant="outline" onClick={handleExport} disabled>
            <Download className="mr-2 h-4 w-4" /> Exportar
          </Button>
          {/* Movement Form Trigger */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Movimentação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Nova Movimentação</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes da movimentação abaixo.
                </DialogDescription>
              </DialogHeader>
              <MovementForm onSuccess={handleSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Placeholder for filters */}
      <div>
        <p className="text-muted-foreground">Filtros por item, tipo, data, localização, usuário, etc. aqui...</p>
      </div>

      {/* DataTable for Movements */}
      <DataTable columns={movementColumns} data={movements} searchKey="item_name" />

    </div>
  );
}

