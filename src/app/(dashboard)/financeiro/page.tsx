"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, Upload, Download } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { paymentMethodColumns, type PaymentMethod } from "./_components/PaymentMethodColumns";
import { PaymentMethodForm } from "./_components/PaymentMethodForm";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

// Fetch payment methods
async function getPaymentMethods(supabase: ReturnType<typeof createClient>): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods') // TODO: Verify table name
    .select('id, name, description, is_active, requires_approval, created_at')
    .order('name', { ascending: true });

  if (error) {
    console.error("Error fetching payment methods:", error);
    toast.error(`Erro ao buscar formas de pagamento: ${error.message}`);
    return [];
  }
  return data || [];
}

// Delete payment method
async function deletePaymentMethodAPI(supabase: ReturnType<typeof createClient>, paymentMethodId: string): Promise<void> {
  const { error } = await supabase
    .from('payment_methods') // TODO: Verify table name
    .delete()
    .eq('id', paymentMethodId);

  if (error) {
    throw new Error(`Erro ao excluir forma de pagamento: ${error.message}`);
  }
}

// CSV Export function
const handleExportCSV = (data: PaymentMethod[]) => {
  if (data.length === 0) {
    toast.warning('Não há formas de pagamento para exportar.');
    return;
  }
  const exportData = data.map(pm => ({
    Nome: pm.name,
    Descricao: pm.description || '',
    Status: pm.is_active ? 'Ativo' : 'Inativo',
    Requer_Aprovacao: pm.requires_approval ? 'Sim' : 'Não',
    Data_Criacao: pm.created_at ? new Date(pm.created_at).toLocaleDateString('pt-BR') : '',
  }));
  const csv = Papa.unparse(exportData);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `formas_pagamento_${new Date().toISOString().split('T')[0]}.csv`);
  toast.success(`${data.length} formas de pagamento exportadas com sucesso.`);
};

// CSV Import function (Placeholder)
const handleImportCSV = (file: File) => {
  toast.info(`Importação de formas de pagamento do arquivo ${file.name} iniciada.`);
  // Placeholder for actual implementation
  setTimeout(() => {
    toast.warning("Funcionalidade de importação ainda não implementada completamente.");
  }, 1500);
};

export default function FormasPagamentoPage() {
  const supabase = createClient();
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [paymentMethods, setPaymentMethods] = React.useState<PaymentMethod[]>([]);
  const [editingPaymentMethod, setEditingPaymentMethod] = React.useState<PaymentMethod | null>(null);
  const [loading, setLoading] = React.useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const fetchAndSetPaymentMethods = React.useCallback(() => {
    setLoading(true);
    getPaymentMethods(supabase)
      .then(setPaymentMethods)
      .finally(() => setLoading(false));
  }, [supabase]);

  React.useEffect(() => {
    fetchAndSetPaymentMethods();
  }, [fetchAndSetPaymentMethods]);

  const handleSuccess = () => {
    setIsFormOpen(false);
    setEditingPaymentMethod(null);
    fetchAndSetPaymentMethods(); // Refresh data
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    setIsFormOpen(true);
  };

  const handleDelete = async (paymentMethodId: string, paymentMethodName: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a forma de pagamento "${paymentMethodName}"? Esta ação não pode ser desfeita.`)) {
      const toastId = toast.loading(`Excluindo forma de pagamento "${paymentMethodName}"...`);
      try {
        await deletePaymentMethodAPI(supabase, paymentMethodId);
        toast.success(`Forma de pagamento "${paymentMethodName}" excluída com sucesso.`, { id: toastId });
        fetchAndSetPaymentMethods(); // Refresh data
      } catch (error: any) {
        toast.error(error.message, { id: toastId });
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImportCSV(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset file input
      }
    }
  };

  // Define table meta for actions
  const tableMeta = {
    editPaymentMethod: handleEdit,
    deletePaymentMethod: handleDelete,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Formas de Pagamento</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileSelected}
            accept=".csv"
            style={{ display: 'none' }}
          />
          <Button variant="outline" onClick={triggerFileInput}>
            <Upload className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportCSV(paymentMethods)} disabled={paymentMethods.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Exportar CSV
          </Button>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
            setIsFormOpen(isOpen);
            if (!isOpen) setEditingPaymentMethod(null); // Clear editing state when closing
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingPaymentMethod(null)}> {/* Ensure editing state is null for new */} 
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Forma de Pagamento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingPaymentMethod ? 'Editar Forma de Pagamento' : 'Criar Nova Forma de Pagamento'}</DialogTitle>
                <DialogDescription>
                  {editingPaymentMethod ? 'Atualize os detalhes da forma de pagamento.' : 'Preencha os detalhes da nova forma de pagamento.'}
                </DialogDescription>
              </DialogHeader>
              <PaymentMethodForm onSuccess={handleSuccess} initialData={editingPaymentMethod ?? undefined} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* DataTable for Payment Methods */}
      <DataTable
        columns={paymentMethodColumns}
        data={paymentMethods}
        loading={loading}
        meta={tableMeta} // Pass actions to columns
      />

    </div>
  );
}
