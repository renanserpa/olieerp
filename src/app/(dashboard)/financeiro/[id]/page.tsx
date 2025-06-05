"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ArrowLeft, Edit, Trash2, Receipt, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  transaction_number: string;
  description: string;
  amount: number;
  transaction_date: string;
  due_date: string | null;
  payment_date: string | null;
  transaction_type: string;
  category_id: string;
  category: {
    name: string;
    type: string;
  };
  payment_method: string;
  status: string;
  reference_type: string | null;
  reference_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Attachment {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  upload_date: string;
}

interface RelatedTransaction {
  id: string;
  transaction_number: string;
  description: string;
  amount: number;
  transaction_date: string;
  status: string;
}

export default function FinancialTransactionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createSupabaseClient();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [relatedTransactions, setRelatedTransactions] = useState<RelatedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      setLoading(true);
      try {
        // Buscar detalhes da transação
        const { data: transactionData, error: transactionError } = await supabase
          .from("financial_transactions")
          .select(`
            *,
            category:category_id (name, type)
          `)
          .eq("id", params.id)
          .single();

        if (transactionError) throw transactionError;
        setTransaction(transactionData);

        // Buscar anexos
        const { data: attachmentsData, error: attachmentsError } = await supabase
          .from("transaction_attachments")
          .select("*")
          .eq("transaction_id", params.id);

        if (!attachmentsError) {
          setAttachments(attachmentsData || []);
        }

        // Buscar transações relacionadas
        if (transactionData.reference_id) {
          const { data: relatedData, error: relatedError } = await supabase
            .from("financial_transactions")
            .select(`
              id,
              transaction_number,
              description,
              amount,
              transaction_date,
              status
            `)
            .eq("reference_id", transactionData.reference_id)
            .neq("id", params.id);

          if (!relatedError) {
            setRelatedTransactions(relatedData || []);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes da transação:", error);
        // TODO: Mostrar mensagem de erro
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTransactionDetails();
    }
  }, [params.id, supabase]);

  const handleEdit = () => {
    // Abrir modal de edição ou navegar para página de edição
    // Por enquanto, apenas mostra um alerta
    alert("Funcionalidade de edição será implementada em breve");
  };

  const handleDelete = async () => {
    if (!transaction) return;
    
    if (window.confirm(`Tem certeza que deseja excluir esta transação?`)) {
      try {
        const { error } = await supabase
          .from("financial_transactions")
          .delete()
          .eq("id", transaction.id);
          
        if (error) throw error;
        
        router.push("/financeiro");
      } catch (error) {
        console.error("Erro ao excluir transação:", error);
        alert("Não foi possível excluir a transação. Verifique se não há registros relacionados.");
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pago':
      case 'recebido':
      case 'quitado':
        return 'bg-green-100 text-green-800';
      case 'parcial':
        return 'bg-blue-100 text-blue-800';
      case 'pendente':
      case 'aguardando':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
      case 'estornado':
        return 'bg-red-100 text-red-800';
      case 'atrasado':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'receita':
      case 'entrada':
        return 'bg-green-100 text-green-800';
      case 'despesa':
      case 'saída':
      case 'saida':
        return 'bg-red-100 text-red-800';
      case 'transferência':
      case 'transferencia':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Carregando detalhes da transação...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p>Transação não encontrada</p>
        <Button onClick={handleBack} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Transação #{transaction.transaction_number}</h1>
          <div className="flex gap-2 ml-2">
            <span className={`px-3 py-1 rounded-full text-sm ${getTransactionTypeColor(transaction.transaction_type)}`}>
              {transaction.transaction_type}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(transaction.status)}`}>
              {transaction.status}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
          <TabsTrigger value="attachments">Anexos</TabsTrigger>
          <TabsTrigger value="related">Relacionadas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações Principais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Descrição</h3>
                  <p className="mt-1">{transaction.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Valor</h3>
                  <p className={`mt-1 text-xl font-bold ${transaction.transaction_type.toLowerCase() === 'receita' ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(transaction.amount)}
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Categoria</h3>
                  <p className="mt-1">{transaction.category?.name || "Não categorizado"}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Método de Pagamento</h3>
                  <p className="mt-1">{transaction.payment_method || "Não informado"}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Data da Transação</h3>
                  <p className="mt-1">
                    {format(new Date(transaction.transaction_date), "PPP", { locale: ptBR })}
                  </p>
                </div>

                {transaction.due_date && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Data de Vencimento</h3>
                    <p className="mt-1">
                      {format(new Date(transaction.due_date), "PPP", { locale: ptBR })}
                    </p>
                  </div>
                )}

                {transaction.payment_date && (
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground">Data de Pagamento</h3>
                    <p className="mt-1">
                      {format(new Date(transaction.payment_date), "PPP", { locale: ptBR })}
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Criado em</h3>
                  <p className="mt-1">
                    {format(new Date(transaction.created_at), "PPP", { locale: ptBR })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {transaction.reference_type && (
            <Card>
              <CardHeader>
                <CardTitle>Referência</CardTitle>
              </CardHeader>
              <CardContent>
                <p><span className="font-medium">Tipo:</span> {transaction.reference_type}</p>
                <p><span className="font-medium">ID:</span> {transaction.reference_id}</p>
                {transaction.reference_type === 'Pedido' && (
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-2" 
                    onClick={() => router.push(`/pedidos/${transaction.reference_id}`)}
                  >
                    Ver pedido relacionado
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {transaction.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{transaction.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="attachments">
          <Card>
            <CardHeader>
              <CardTitle>Anexos</CardTitle>
              <CardDescription>
                Documentos e arquivos relacionados a esta transação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attachments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="border rounded-md p-4 flex flex-col">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-blue-500" />
                          <span className="font-medium truncate">{attachment.file_name}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4 truncate">
                        {attachment.file_type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-auto">
                        Adicionado em {format(new Date(attachment.upload_date), "dd/MM/yyyy")}
                      </p>
                      <div className="mt-2 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(attachment.file_url, '_blank')}
                        >
                          Visualizar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhum anexo encontrado para esta transação.
                  </p>
                  <Button variant="outline" className="mt-4">
                    Adicionar Anexo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="related">
          <Card>
            <CardHeader>
              <CardTitle>Transações Relacionadas</CardTitle>
              <CardDescription>
                Outras transações vinculadas à mesma referência
              </CardDescription>
            </CardHeader>
            <CardContent>
              {relatedTransactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Número</th>
                        <th className="text-left py-2 px-4">Descrição</th>
                        <th className="text-left py-2 px-4">Data</th>
                        <th className="text-left py-2 px-4">Valor</th>
                        <th className="text-left py-2 px-4">Status</th>
                        <th className="text-right py-2 px-4">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedTransactions.map((related) => (
                        <tr key={related.id} className="border-b hover:bg-muted/50">
                          <td className="py-2 px-4">{related.transaction_number}</td>
                          <td className="py-2 px-4">{related.description}</td>
                          <td className="py-2 px-4">
                            {format(new Date(related.transaction_date), "dd/MM/yyyy")}
                          </td>
                          <td className="py-2 px-4">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(related.amount)}
                          </td>
                          <td className="py-2 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(related.status)}`}>
                              {related.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/financeiro/${related.id}`)}
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    Nenhuma transação relacionada encontrada.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
