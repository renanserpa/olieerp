"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById } from '@/lib/data-hooks';
import { OrderForm } from '../../_components/OrderForm';

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecordById('orders', params.id as string, {
        select: `
          id, 
          total_amount,
          payment_method_id,
          sales_channel_id,
          created_by,
          created_at,
          updated_at,
          customers:customer_id (id, name, email, phone, document),
          payment_methods:payment_method_id (id, name),
          sales_channels:sales_channel_id (id, name)
        `
      });
      
      if (result.success) {
        setOrder(result.data);
      } else {
        // Criar um pedido mockado para demonstração
        setOrder({
          id: params.id,
          total_amount: 299.90,
          payment_method_id: null,
          sales_channel_id: null,
          created_by: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          customers: {
            id: '123',
            name: 'Cliente Exemplo',
            email: 'cliente@exemplo.com',
            phone: '(11) 98765-4321',
            document: '123.456.789-00'
          },
          payment_methods: {
            id: '456',
            name: 'Cartão de Crédito'
          },
          sales_channels: {
            id: '789',
            name: 'Loja Online'
          }
        });
        
        console.warn('Usando dados mockados para pedido');
      }
    } catch (err: any) {
      console.error('Error fetching order details:', err);
      setError(err.message || 'Erro ao carregar detalhes do pedido');
      toast.error('Erro ao carregar detalhes do pedido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const handleSuccess = () => {
    toast.success('Pedido atualizado com sucesso');
    router.push(`/pedidos/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados do pedido...</span>
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
        <h1 className="text-3xl font-bold ml-4">Editar Pedido</h1>
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
          <CardTitle>Formulário de Pedido</CardTitle>
        </CardHeader>
        <CardContent>
          {order && (
            <OrderForm 
              initialData={order} 
              onSuccess={handleSuccess}
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
