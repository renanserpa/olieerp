"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById } from '@/lib/data-hooks';
import { SupplierForm } from '../../_components/SupplierForm';

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecordById('suppliers', params.id as string);
      
      if (result.success) {
        setSupplier(result.data);
      } else {
        // Criar um fornecedor mockado para demonstração
        setSupplier({
          id: params.id,
          company_name: 'Fornecedor Exemplo',
          trading_name: 'Nome Fantasia Exemplo',
          cnpj: '12.345.678/0001-90',
          email: 'contato@fornecedor.com',
          phone: '(11) 98765-4321',
          address: 'Rua Exemplo, 123',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '01234-567',
          contact_name: 'João Silva',
          contact_phone: '(11) 91234-5678',
          notes: 'Este é um fornecedor de demonstração.',
          is_active: true,
          created_at: new Date().toISOString()
        });
        
        console.warn('Usando dados mockados para fornecedor');
      }
    } catch (err: any) {
      console.error('Error fetching supplier details:', err);
      setError(err.message || 'Erro ao carregar detalhes do fornecedor');
      toast.error('Erro ao carregar detalhes do fornecedor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [params.id]);

  const handleSuccess = () => {
    toast.success('Fornecedor atualizado com sucesso');
    router.push(`/fornecedores/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados do fornecedor...</span>
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
        <h1 className="text-3xl font-bold ml-4">Editar Fornecedor</h1>
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
          <CardTitle>Formulário de Fornecedor</CardTitle>
        </CardHeader>
        <CardContent>
          {supplier && (
            <SupplierForm 
              initialData={supplier} 
              onSuccess={handleSuccess}
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
