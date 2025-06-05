"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRecordById } from '@/lib/data-hooks';
import { ComponentForm } from '../../_components/ComponentForm';

export default function EditComponentPage() {
  const params = useParams();
  const router = useRouter();
  const [component, setComponent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComponent = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getRecordById('components', params.id as string);
      
      if (result.success) {
        setComponent(result.data);
      } else {
        // Criar um componente mockado para demonstração
        setComponent({
          id: params.id,
          name: 'Componente Exemplo',
          description: 'Descrição detalhada do componente exemplo',
          image_url: null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        console.warn('Usando dados mockados para componente');
      }
    } catch (err: any) {
      console.error('Error fetching component details:', err);
      setError(err.message || 'Erro ao carregar detalhes do componente');
      toast.error('Erro ao carregar detalhes do componente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComponent();
  }, [params.id]);

  const handleSuccess = () => {
    toast.success('Componente atualizado com sucesso');
    router.push(`/componentes/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados do componente...</span>
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
        <h1 className="text-3xl font-bold ml-4">Editar Componente</h1>
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
          <CardTitle>Formulário de Componente</CardTitle>
        </CardHeader>
        <CardContent>
          {component && (
            <ComponentForm 
              initialData={component} 
              onSuccess={handleSuccess}
              isEditing={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
