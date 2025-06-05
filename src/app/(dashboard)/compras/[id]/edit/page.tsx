"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById } from '@/lib/data-hooks';
import { PurchaseRequestForm } from '../../_components/PurchaseRequestForm';

export default function EditPurchaseRequestPage() {
  const params = useParams();
  const router = useRouter();
  const [purchaseRequest, setPurchaseRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPurchaseRequest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecordById('purchase_requests', params.id as string, {
        select: `
          id, 
          status_id,
          requester_id,
          approver_id,
          request_date,
          approval_date,
          created_at,
          updated_at,
          purchase_request_statuses:status_id (id, name, color)
        `
      });
      
      if (result.success) {
        setPurchaseRequest(result.data);
      } else {
        // Criar uma solicitação de compra mockada para demonstração
        setPurchaseRequest({
          id: params.id,
          status_id: null,
          requester_id: null,
          approver_id: null,
          request_date: new Date().toISOString(),
          approval_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          purchase_request_statuses: {
            id: '123',
            name: 'Pendente',
            color: 'yellow'
          }
        });
        
        console.warn('Usando dados mockados para solicitação de compra');
      }
    } catch (err: any) {
      console.error('Error fetching purchase request details:', err);
      setError(err.message || 'Erro ao carregar detalhes da solicitação de compra');
      toast.error('Erro ao carregar detalhes da solicitação de compra.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseRequest();
  }, [params.id]);

  const handleSuccess = () => {
    toast.success('Solicitação de compra atualizada com sucesso');
    router.push(`/compras/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados da solicitação de compra...</span>
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
        <h1 className="text-3xl font-bold ml-4">Editar Solicitação de Compra</h1>
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
          <CardTitle>Formulário de Solicitação de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          {purchaseRequest && (
            <PurchaseRequestForm 
              initialData={purchaseRequest} 
              onSuccess={handleSuccess}
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
