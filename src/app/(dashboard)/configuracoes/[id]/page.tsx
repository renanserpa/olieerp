"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, FileText, Settings, Globe, User, Database } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface Configuracao {
  id: string;
  key: string;
  value: string;
  description: string;
  group: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export default function ConfiguracaoDetalhes() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [configuracao, setConfiguracao] = useState<Configuracao | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const fetchConfiguracao = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("global_settings")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setConfiguracao(data);
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes da configuração:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os detalhes da configuração.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchConfiguracao();
    }
  }, [params.id, supabase, toast]);

  const handleDelete = async () => {
    if (!configuracao) return;
    
    if (configuracao.is_system) {
      toast({
        title: "Operação não permitida",
        description: "Não é possível excluir configurações do sistema.",
        variant: "destructive",
      });
      return;
    }

    if (!confirm("Tem certeza que deseja excluir esta configuração?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("global_settings")
        .delete()
        .eq("id", params.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Configuração excluída",
        description: "A configuração foi excluída com sucesso.",
      });
      
      router.push("/configuracoes");
    } catch (error) {
      console.error("Erro ao excluir configuração:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a configuração.",
        variant: "destructive",
      });
    }
  };

  const getGroupIcon = (group: string) => {
    switch (group.toLowerCase()) {
      case 'empresa':
        return <Globe className="h-5 w-5" />;
      case 'sistema':
        return <Settings className="h-5 w-5" />;
      case 'usuários':
        return <User className="h-5 w-5" />;
      default:
        return <Database className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <p>Carregando detalhes da configuração...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!configuracao) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center h-40">
              <p className="text-lg font-medium mb-4">Configuração não encontrada</p>
              <Button onClick={() => router.push("/configuracoes")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para lista de configurações
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/configuracoes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/configuracoes/editar/${params.id}`)}>
            <Edit className="mr-2 h-4 w-4" /> Editar
          </Button>
          {!configuracao.is_system && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="mr-2 h-4 w-4" /> Excluir
            </Button>
          )}
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-3 rounded-full">
              {getGroupIcon(configuracao.group)}
            </div>
            <div>
              <CardTitle className="text-2xl">{configuracao.key}</CardTitle>
              <CardDescription>
                Grupo: {configuracao.group}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Valor</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-mono">{configuracao.value}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Descrição</h3>
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="flex items-start">
                  <FileText className="h-4 w-4 mr-2 text-gray-500 mt-1" />
                  <p>{configuracao.description}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${configuracao.is_system ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                {configuracao.is_system ? 'Configuração do Sistema' : 'Configuração Personalizada'}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-sm text-gray-500 border-t pt-4">
          <div className="w-full flex justify-between">
            <span>
              Cadastrado em: {configuracao.created_at && format(new Date(configuracao.created_at), "PPP", { locale: ptBR })}
            </span>
            <span>
              Última atualização: {configuracao.updated_at && format(new Date(configuracao.updated_at), "PPP", { locale: ptBR })}
            </span>
          </div>
        </CardFooter>
      </Card>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Informações Importantes</h3>
        <p className="text-yellow-700">
          {configuracao.is_system 
            ? "Esta é uma configuração do sistema. Alterações podem afetar o funcionamento do ERP. Modifique com cautela."
            : "Esta é uma configuração personalizada. Você pode modificá-la conforme necessário para atender às necessidades da sua empresa."}
        </p>
      </div>
    </div>
  );
}
