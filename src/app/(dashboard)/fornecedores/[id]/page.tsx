"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Pencil, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById, deleteRecord } from '@/lib/data-hooks';

export default function SupplierDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [supplier, setSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
          name: 'Fornecedor Exemplo',
          fantasy_name: 'Exemplo Ltda',
          cnpj: '12.345.678/0001-90',
          email: 'contato@exemplo.com',
          phone: '(11) 98765-4321',
          address: 'Rua Exemplo, 123',
          city: 'São Paulo',
          state: 'SP',
          postal_code: '01234-567',
          notes: 'Este é um fornecedor de demonstração.',
          created_at: new Date().toISOString()
        });
        
        console.warn('Usando dados mockados para fornecedor');
      }
    } catch (err: any) {
      console.error('Error fetching supplier details:', err);
      setError(err.message || 'Erro ao carregar detalhes do fornecedor');
      
      // Criar um fornecedor mockado para demonstração
      setSupplier({
        id: params.id,
        name: 'Fornecedor Exemplo',
        fantasy_name: 'Exemplo Ltda',
        cnpj: '12.345.678/0001-90',
        email: 'contato@exemplo.com',
        phone: '(11) 98765-4321',
        address: 'Rua Exemplo, 123',
        city: 'São Paulo',
        state: 'SP',
        postal_code: '01234-567',
        notes: 'Este é um fornecedor de demonstração.',
        created_at: new Date().toISOString()
      });
      
      toast.error('Erro ao carregar detalhes do fornecedor. Exibindo dados de demonstração.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupplier();
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) {
      return;
    }

    try {
      setDeleting(true);
      const result = await deleteRecord('suppliers', params.id as string);
      
      if (result.success) {
        toast.success('Fornecedor excluído com sucesso');
        router.push('/fornecedores');
      } else {
        throw new Error('Erro ao excluir fornecedor');
      }
    } catch (err: any) {
      console.error('Error deleting supplier:', err);
      toast.error(err.message || 'Erro ao excluir fornecedor');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando detalhes do fornecedor...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-3xl font-bold ml-4">Detalhes do Fornecedor</h1>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/fornecedores/${params.id}/edit`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Editar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </>
            )}
          </Button>
        </div>
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

      {supplier && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Dados principais do fornecedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Razão Social</p>
                <p className="text-lg">{supplier.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nome Fantasia</p>
                <p className="text-lg">{supplier.fantasy_name || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">CNPJ</p>
                <p className="text-lg">{supplier.cnpj || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p className="text-lg">{supplier.email || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Telefone</p>
                <p className="text-lg">{supplier.phone || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
              <CardDescription>Localização do fornecedor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Endereço</p>
                <p className="text-lg">{supplier.address || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Cidade</p>
                <p className="text-lg">{supplier.city || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="text-lg">{supplier.state || 'Não informado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">CEP</p>
                <p className="text-lg">{supplier.postal_code || 'Não informado'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>Informações adicionais</CardDescription>
            </CardHeader>
            <CardContent>
              <p>{supplier.notes || 'Nenhuma observação registrada.'}</p>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                Fornecedor cadastrado em: {new Date(supplier.created_at).toLocaleDateString('pt-BR')}
              </p>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
