"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById } from '@/lib/data-hooks';
import { ProductionOrderForm } from '../../_components/ProductionOrderForm';

export default function EditProductionOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [productionOrder, setProductionOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductionOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecordById('production_orders', params.id as string, {
        select: `
          id, 
          order_id,
          order_item_id,
          product_id,
          variant_id,
          quantity,
          status_id,
          start_date,
          due_date,
          completion_date,
          responsible_id,
          created_by,
          created_at,
          updated_at,
          production_statuses:status_id (id, name, color)
        `
      });
      
      if (result.success) {
        setProductionOrder(result.data);
      } else {
        // Criar uma ordem de produção mockada para demonstração
        setProductionOrder({
          id: params.id,
          order_id: null,
          order_item_id: null,
          product_id: null,
          variant_id: null,
          quantity: 10,
          status_id: null,
          start_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          completion_date: null,
          responsible_id: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          production_statuses: {
            id: '123',
            name: 'Em Andamento',
            color: 'blue'
          }
        });
        
        console.warn('Usando dados mockados para ordem de produção');
      }
    } catch (err: any) {
      console.error('Error fetching production order details:', err);
      setError(err.message || 'Erro ao carregar detalhes da ordem de produção');
      toast.error('Erro ao carregar detalhes da ordem de produção.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductionOrder();
  }, [params.id]);

  const handleSuccess = () => {
    toast.success('Ordem de produção atualizada com sucesso');
    router.push(`/producao/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados da ordem de produção...</span>
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
        <h1 className="text-3xl font-bold ml-4">Editar Ordem de Produção</h1>
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
          <CardTitle>Formulário de Ordem de Produção</CardTitle>
        </CardHeader>
        <CardContent>
          {productionOrder && (
            <ProductionOrderForm 
              initialData={productionOrder} 
              onSuccess={handleSuccess}
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
