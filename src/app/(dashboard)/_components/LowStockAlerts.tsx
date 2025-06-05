"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Activity, BarChart, DollarSign, Users } from 'lucide-react';
import { useLowStockAlerts } from '@/lib/utils/dashboard-hooks';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

export function LowStockAlerts() {
  const { lowStockItems, loading, error } = useLowStockAlerts();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5 text-yellow-500" />
          Alertas de Estoque Baixo
        </CardTitle>
        <CardDescription>Itens que atingiram ou estão abaixo do nível mínimo.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground">Carregando alertas...</p>
        ) : error ? (
          <p className="text-red-500">Erro ao carregar alertas: {error}</p>
        ) : lowStockItems.length === 0 ? (
          <p className="text-muted-foreground">Nenhum item com estoque baixo.</p>
        ) : (
          <ul className="space-y-3">
            {lowStockItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-2 border rounded-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800/50">
                <div className="flex items-center">
                  <Package className="mr-3 h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">{item.name}</p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                      Atual: {item.current_quantity} {item.unit_of_measure || ''} (Mín: {item.min_quantity ?? 'N/A'})
                    </p>
                  </div>
                </div>
                <Link href={`/estoque?itemId=${item.id}`} passHref>
                   <Button variant="outline" size="sm">Ver Item</Button>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
