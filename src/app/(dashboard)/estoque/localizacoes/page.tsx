"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { locationColumns, type StockLocation } from "./_components/LocationColumns"; // Import real columns and type
import { LocationForm } from "./_components/LocationForm"; // Import real form
import { createSupabaseServerClientAlternative } from "@/lib/supabase/server-alternative"; // Keep for potential server-side fetches
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
// TODO: Import AlertDialog for delete confirmation

// Fetch real location data from Supabase (Placeholder)
async function getLocations(): Promise<StockLocation[]> {
  console.log("Fetching stock locations...");
  // Example structure matching potential columns
  return [
    { id: 'uuid-loc-1', name: 'Almoxarifado Principal', description: 'Localização central de estoque', address: 'Rua Principal, 123', created_at: new Date().toISOString() },
    { id: 'uuid-loc-2', name: 'Estoque Loja A', description: 'Estoque da filial A', address: 'Av. Secundária, 456', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'uuid-loc-3', name: 'Estoque Produção', description: 'Área de estoque na produção', created_at: new Date(Date.now() - 172800000).toISOString() },
  ];
  /* Replace with actual Supabase fetch:
  const supabase = createSupabaseServerClientAlternative();
  const { data, error } = await supabase
    .from('stock_locations') // Assuming table name
    .select(`
      id,
      name,
      description,
      address,
      created_at
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching locations:", error);
    return [];
  }

  return data || [];
  */
}

// Placeholder delete function (replace with API call)
async function deleteLocationAPI(locationId: string): Promise<void> {
  console.log(`API Placeholder: Deleting location ${locationId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
}

export default function LocalizacoesEstoquePage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [locations, setLocations] = React.useState<StockLocation[]>([]);
  const [editingLocation, setEditingLocation] = React.useState<StockLocation | null>(null);

  const fetchAndSetLocations = () => {
    getLocations().then(setLocations);
  };

  React.useEffect(() => {
    fetchAndSetLocations();
  }, []);

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingLocation(null);
    fetchAndSetLocations();
    // TODO: Add toast notification for success
  };

  const handleEdit = (location: StockLocation) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const handleDelete = async (locationId: string, locationName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a localização "${locationName}"? Esta ação pode afetar itens de estoque associados.`)) {
      try {
        await deleteLocationAPI(locationId);
        console.log(`Location ${locationId} deleted successfully.`);
        alert(`Localização "${locationName}" excluída com sucesso (placeholder).`);
        fetchAndSetLocations(); // Refresh data
        // TODO: Add toast notification for success
      } catch (error) {
        console.error("Error deleting location:", error);
        alert(`Erro ao excluir localização "${locationName}".`);
        // TODO: Add toast notification for error
      }
    }
  };

  // Memoize columns
  const columns = React.useMemo(() => locationColumns(handleEdit, handleDelete), [handleEdit, handleDelete]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Gestão de Localizações de Estoque</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingLocation(null); // Reset editing state on close
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingLocation(null)}> {/* Ensure editingLocation is null for new */}
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Localização
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingLocation ? 'Editar Localização' : 'Criar Nova Localização'}</DialogTitle>
                <DialogDescription>
                  {editingLocation ? 'Atualize os detalhes da localização abaixo.' : 'Preencha os detalhes da localização abaixo.'}
                </DialogDescription>
              </DialogHeader>
              <LocationForm onSuccess={handleSuccess} initialData={editingLocation ?? undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Placeholder for filters */}
      <div>
        <p className="text-muted-foreground">Filtros por nome, etc. aqui...</p>
      </div>

      {/* DataTable for Locations */}
      <DataTable columns={columns} data={locations} searchKey="name" />

    </div>
  );
}

