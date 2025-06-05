"use client";

import React from 'react';
import { ProductionOrder } from './columns'; // Assuming type is exported from columns
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define the structure for Kanban columns (statuses)
interface KanbanColumn {
  id: string;
  name: string;
  color?: string; // Optional color for the column header
}

interface ProductionKanbanBoardProps {
  orders: ProductionOrder[];
  statuses: KanbanColumn[]; // Pass the statuses to define columns
  loading: boolean;
}

// Helper to format date briefly
const formatBriefDate = (dateString: string | null | undefined) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit' });
  } catch (e) {
    return "";
  }
};

export function ProductionKanbanBoard({ orders, statuses, loading }: ProductionKanbanBoardProps) {

  if (loading) {
    return <p className="text-muted-foreground text-center py-10">Carregando ordens...</p>;
  }

  if (statuses.length === 0) {
    return <p className="text-muted-foreground text-center py-10">Nenhum status de produção encontrado para exibir o Kanban.</p>;
  }

  // Group orders by status ID
  const ordersByStatus = statuses.reduce((acc, status) => {
    acc[status.id] = orders.filter(order => order.status_id === status.id);
    return acc;
  }, {} as { [key: string]: ProductionOrder[] });

  return (
    <div className="flex gap-4 overflow-x-auto pb-4"> {/* Enable horizontal scrolling */}
      {statuses.map((status) => (
        <div key={status.id} className="min-w-[300px] w-[300px] flex-shrink-0"> {/* Fixed width columns */}
          <Card className="h-full bg-muted/50">
            <CardHeader className="p-3 border-b mb-2">
              {/* TODO: Use status.color for header background/border */}
              <CardTitle className="text-sm font-medium flex justify-between items-center">
                <span>{status.name}</span>
                <Badge variant="secondary">{ordersByStatus[status.id]?.length || 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-3 overflow-y-auto max-h-[60vh]"> {/* Scrollable content */}
              {ordersByStatus[status.id] && ordersByStatus[status.id].length > 0 ? (
                ordersByStatus[status.id].map((order) => (
                  <Card key={order.id} className="shadow-sm hover:shadow-md transition-shadow cursor-grab"> {/* Add cursor-grab for future DnD */}
                    <CardContent className="p-3 space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-semibold text-primary">OP #{order.id.substring(0, 8)}</span>
                        {order.priority_name && <Badge variant="outline" className="text-xs">{order.priority_name}</Badge>}
                      </div>
                      <p className="text-sm font-medium leading-none truncate" title={order.order_ref}> {/* Show order ref */}
                        {order.order_ref || "Pedido não vinculado"}
                      </p>
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                        <span>Início: {formatBriefDate(order.start_date) || "-"}</span>
                        <span>Fim: {formatBriefDate(order.end_date) || "-"}</span>
                      </div>
                      {/* TODO: Add more details like assigned user or product */}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhuma ordem neste status.</p>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
