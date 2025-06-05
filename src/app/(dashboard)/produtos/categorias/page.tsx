"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { categoryColumns, type ProductCategory } from "./_components/CategoryColumns"; // Import real columns and type
import { CategoryForm } from "./_components/CategoryForm"; // Import real form
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

// Fetch real category data from Supabase (Placeholder)
async function getCategories(): Promise<ProductCategory[]> {
  console.log("Fetching product categories...");
  // Example structure matching potential columns
  return [
    { id: 'uuid-cat-1', name: 'Categoria Principal A', description: 'Descrição da categoria A', created_at: new Date().toISOString() },
    { id: 'uuid-cat-2', name: 'Categoria Principal B', description: 'Descrição da categoria B', created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: 'uuid-cat-3', name: 'Subcategoria A.1', parent_category_id: 'uuid-cat-1', parent_category_name: 'Categoria Principal A', description: 'Subcategoria de A', created_at: new Date(Date.now() - 172800000).toISOString() },
  ];
  /* Replace with actual Supabase fetch:
  const supabase = createSupabaseServerClientAlternative();
  const { data, error } = await supabase
    .from('product_categories') // Assuming table name
    .select(`
      id,
      name,
      description,
      parent_category_id,
      parent_category:product_categories!parent_category_id ( name ), // Self-join example
      created_at
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  const mappedData = data?.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    parent_category_id: item.parent_category_id,
    parent_category_name: (item.parent_category as { name: string })?.name,
    created_at: item.created_at,
  })) || [];

  return mappedData;
  */
}

// Placeholder delete function (replace with API call)
async function deleteCategoryAPI(categoryId: string): Promise<void> {
  console.log(`API Placeholder: Deleting category ${categoryId}`);
  await new Promise(resolve => setTimeout(resolve, 500));
}

export default function CategoriasProdutoPage() {
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<ProductCategory[]>([]);
  const [editingCategory, setEditingCategory] = React.useState<ProductCategory | null>(null);

  const fetchAndSetCategories = () => {
    getCategories().then(setCategories);
  };

  React.useEffect(() => {
    fetchAndSetCategories();
  }, []);

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    fetchAndSetCategories();
    // TODO: Add toast notification for success
  };

  const handleEdit = (category: ProductCategory) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (categoryId: string, categoryName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Esta ação pode afetar produtos associados.`)) {
      try {
        await deleteCategoryAPI(categoryId);
        console.log(`Category ${categoryId} deleted successfully.`);
        alert(`Categoria "${categoryName}" excluída com sucesso (placeholder).`);
        fetchAndSetCategories(); // Refresh data
        // TODO: Add toast notification for success
      } catch (error) {
        console.error("Error deleting category:", error);
        alert(`Erro ao excluir categoria "${categoryName}".`);
        // TODO: Add toast notification for error
      }
    }
  };

  // Memoize columns
  const columns = React.useMemo(() => categoryColumns(handleEdit, handleDelete), [handleEdit, handleDelete]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Gestão de Categorias de Produtos</h1>
        <div className="flex items-center gap-2">
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingCategory(null); // Reset editing state on close
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCategory(null)}> {/* Ensure editingCategory is null for new */}
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Criar Nova Categoria'}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? 'Atualize os detalhes da categoria abaixo.' : 'Preencha os detalhes da categoria abaixo.'}
                </DialogDescription>
              </DialogHeader>
              <CategoryForm onSuccess={handleSuccess} initialData={editingCategory ?? undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Placeholder for filters */}
      <div>
        <p className="text-muted-foreground">Filtros por nome, etc. aqui...</p>
      </div>

      {/* DataTable for Categories */}
      <DataTable columns={columns} data={categories} searchKey="name" />

    </div>
  );
}

