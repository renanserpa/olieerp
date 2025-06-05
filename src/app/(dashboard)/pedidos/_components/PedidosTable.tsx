"use client";

import React, { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  ShoppingCart
} from "lucide-react";

// Dados de exemplo para pedidos
const pedidosData = [
  { 
    id: "1", 
    customer_name: "Maria Silva", 
    order_number: "PED-2025-001", 
    date: "2025-05-15", 
    total: 459.70, 
    items_count: 3, 
    status: "Concluído", 
    payment_status: "Pago" 
  },
  { 
    id: "2", 
    customer_name: "João Pereira", 
    order_number: "PED-2025-002", 
    date: "2025-05-18", 
    total: 289.80, 
    items_count: 2, 
    status: "Em produção", 
    payment_status: "Pago" 
  },
  { 
    id: "3", 
    customer_name: "Ana Souza", 
    order_number: "PED-2025-003", 
    date: "2025-05-20", 
    total: 749.50, 
    items_count: 5, 
    status: "Aguardando envio", 
    payment_status: "Pago" 
  },
  { 
    id: "4", 
    customer_name: "Carlos Oliveira", 
    order_number: "PED-2025-004", 
    date: "2025-05-22", 
    total: 189.90, 
    items_count: 1, 
    status: "Aguardando pagamento", 
    payment_status: "Pendente" 
  },
  { 
    id: "5", 
    customer_name: "Fernanda Lima", 
    order_number: "PED-2025-005", 
    date: "2025-05-25", 
    total: 539.60, 
    items_count: 4, 
    status: "Novo", 
    payment_status: "Pendente" 
  },
];

export default function PedidosTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [pedidos, setPedidos] = useState(pedidosData);

  // Filtrar pedidos com base no termo de pesquisa
  const filteredPedidos = pedidos.filter(
    (pedido) =>
      pedido.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Manipular a exclusão de pedido
  const handleDeletePedido = (id) => {
    setPedidos(pedidos.filter((p) => p.id !== id));
  };

  // Formatar preço para exibição
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  // Formatar data para exibição
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
  };

  // Obter classe de cor com base no status
  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'concluído':
        return "bg-green-100 text-green-800";
      case 'em produção':
        return "bg-blue-100 text-blue-800";
      case 'aguardando envio':
        return "bg-purple-100 text-purple-800";
      case 'aguardando pagamento':
        return "bg-yellow-100 text-yellow-800";
      case 'novo':
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Obter classe de cor com base no status de pagamento
  const getPaymentStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'pago':
        return "bg-green-100 text-green-800";
      case 'pendente':
        return "bg-yellow-100 text-yellow-800";
      case 'cancelado':
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Buscar pedidos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Itens</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPedidos.length > 0 ? (
              filteredPedidos.map((pedido) => (
                <TableRow key={pedido.id}>
                  <TableCell className="font-medium">{pedido.order_number}</TableCell>
                  <TableCell>{pedido.customer_name}</TableCell>
                  <TableCell>{formatDate(pedido.date)}</TableCell>
                  <TableCell>{pedido.items_count}</TableCell>
                  <TableCell>{formatPrice(pedido.total)}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(pedido.status)}`}
                    >
                      {pedido.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusClass(pedido.payment_status)}`}
                    >
                      {pedido.payment_status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" /> Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center">
                          <Edit className="mr-2 h-4 w-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="flex items-center text-red-600"
                          onClick={() => handleDeletePedido(pedido.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                  Nenhum pedido encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
