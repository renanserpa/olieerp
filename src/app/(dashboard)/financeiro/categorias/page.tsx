"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { financialCategoryColumns, FinancialCategory } from "../_components/FinancialCategoryColumns";
import { FinancialCategoryForm } from "../_components/FinancialCategoryForm";

export default function FinancialCategoriesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<FinancialCategory | undefined>(undefined);

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Function to fetch categories from Supabase
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching financial categories:", error);
      toast.error(`Erro ao carregar categorias: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle category deletion
  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) return;

    try {
      const { error } = await supabase
        .from('financial_categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      
      toast.success(`Categoria "${categoryName}" excluída com sucesso!`);
      fetchCategories(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(`Erro ao excluir categoria: ${error.message}`);
    }
  };

  // Function to open edit form
  const handleEditCategory = (category: FinancialCategory) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  // Function to handle form success (create/edit)
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedCategory(undefined);
    fetchCategories(); // Refresh the list
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categorias Financeiras</h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de receitas e despesas do sistema.
          </p>
        </div>
        <Button onClick={() => { setSelectedCategory(undefined); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Categoria
        </Button>
      </div>

      <DataTable
        columns={financialCategoryColumns}
        data={categories}
        loading={loading}
        searchColumn="name"
        meta={{
          editCategory: handleEditCategory,
          deleteCategory: handleDeleteCategory,
        }}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? "Editar Categoria" : "Nova Categoria"}
            </DialogTitle>
          </DialogHeader>
          <FinancialCategoryForm
            initialData={selectedCategory}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
