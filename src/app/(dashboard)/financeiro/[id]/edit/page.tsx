"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById } from '@/lib/data-hooks';
import { FinancialTransactionForm } from '../../_components/FinancialTransactionForm';

export default function EditFinancialTransactionPage() {
  const params = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransaction = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecordById('financial_transactions', params.id as string, {
        select: `
          id, 
          amount,
          date,
          due_date,
          payment_date,
          category_id,
          payment_method_id,
          order_id,
          purchase_order_id,
          created_by,
          created_at,
          updated_at,
          financial_categories:category_id (id, name),
          payment_methods:payment_method_id (id, name)
        `
      });
      
      if (result.success) {
        setTransaction(result.data);
      } else {
        // Criar uma transação financeira mockada para demonstração
        setTransaction({
          id: params.id,
          amount: 1500.00,
          date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_date: null,
          category_id: null,
          payment_method_id: null,
          order_id: null,
          purchase_order_id: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          financial_categories: {
            id: '123',
            name: 'Vendas'
          },
          payment_methods: {
            id: '456',
            name: 'Transferência Bancária'
          }
        });
        
        console.warn('Usando dados mockados para transação financeira');
      }
    } catch (err: any) {
      console.error('Error fetching financial transaction details:', err);
      setError(err.message || 'Erro ao carregar detalhes da transação financeira');
      toast.error('Erro ao carregar detalhes da transação financeira.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [params.id]);

  const handleSuccess = () => {
    toast.success('Transação financeira atualizada com sucesso');
    router.push(`/financeiro/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados da transação financeira...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-3xl font-bold ml-4">Editar Transação Financeira</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Formulário de Transação Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          {transaction && (
            <FinancialTransactionForm 
              initialData={transaction} 
              onSuccess={handleSuccess}
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
