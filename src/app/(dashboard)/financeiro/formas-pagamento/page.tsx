"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { DataTable } from "@/components/ui/data-table";
import { paymentMethodColumns, PaymentMethod } from "../_components/PaymentMethodColumns";
import { PaymentMethodForm } from "../_components/PaymentMethodForm";

export default function PaymentMethodsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | undefined>(undefined);

  // Fetch payment methods on component mount
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // Function to fetch payment methods from Supabase
  const fetchPaymentMethods = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');

      if (error) throw error;
      setPaymentMethods(data || []);
    } catch (error: any) {
      console.error("Error fetching payment methods:", error);
      toast.error(`Erro ao carregar formas de pagamento: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle payment method deletion
  const handleDeletePaymentMethod = async (methodId: string, methodName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a forma de pagamento "${methodName}"?`)) return;

    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;
      
      toast.success(`Forma de pagamento "${methodName}" excluída com sucesso!`);
      fetchPaymentMethods(); // Refresh the list
    } catch (error: any) {
      console.error("Error deleting payment method:", error);
      toast.error(`Erro ao excluir forma de pagamento: ${error.message}`);
    }
  };

  // Function to open edit form
  const handleEditPaymentMethod = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setFormOpen(true);
  };

  // Function to handle form success (create/edit)
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedMethod(undefined);
    fetchPaymentMethods(); // Refresh the list
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Formas de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie as formas de pagamento disponíveis no sistema.
          </p>
        </div>
        <Button onClick={() => { setSelectedMethod(undefined); setFormOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nova Forma de Pagamento
        </Button>
      </div>

      <DataTable
        columns={paymentMethodColumns}
        data={paymentMethods}
        loading={loading}
        searchColumn="name"
        meta={{
          editPaymentMethod: handleEditPaymentMethod,
          deletePaymentMethod: handleDeletePaymentMethod,
        }}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMethod ? "Editar Forma de Pagamento" : "Nova Forma de Pagamento"}
            </DialogTitle>
          </DialogHeader>
          <PaymentMethodForm
            initialData={selectedMethod}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
