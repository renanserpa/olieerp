"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById } from '@/lib/data-hooks';
import { ClientForm } from '../../_components/ClientForm';

export default function EditClientPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecordById('clients', params.id as string);
      
      if (result.success) {
        setClient(result.data);
      } else {
        // Criar um cliente mockado para demonstração
        setClient({
          id: params.id,
          name: 'Cliente Exemplo',
          email: 'cliente@exemplo.com',
          phone: '(11) 98765-4321',
          document: '123.456.789-00',
          address: 'Rua Exemplo, 123',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '01234-567',
          notes: 'Este é um cliente de demonstração.',
          is_active: true,
          created_at: new Date().toISOString()
        });
        
        console.warn('Usando dados mockados para cliente');
      }
    } catch (err: any) {
      console.error('Error fetching client details:', err);
      setError(err.message || 'Erro ao carregar detalhes do cliente');
      toast.error('Erro ao carregar detalhes do cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  const handleSuccess = () => {
    toast.success('Cliente atualizado com sucesso');
    router.push(`/clientes/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados do cliente...</span>
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
        <h1 className="text-3xl font-bold ml-4">Editar Cliente</h1>
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
          <CardTitle>Formulário de Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          {client && (
            <ClientForm 
              initialData={client} 
              onSuccess={handleSuccess}
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
