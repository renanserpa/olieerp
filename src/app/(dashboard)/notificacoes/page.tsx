"use client"; // Needed for potential client-side interactions like marking as read

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, History, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
// TODO: Import DataTable, columns for notifications and logs

// TODO: Fetch data for notifications and logs
async function getNotifications(): Promise<any[]> { // Replace any with Notification type
  console.log("Fetching notifications...");
  // Example structure
  return [
    { id: '1', user_id: 'user1', message: 'Pedido #123 atualizado para Em Produção.', type: 'info', date: new Date().toISOString(), is_read: false },
    { id: '2', user_id: 'user1', message: 'Estoque baixo para o item XYZ.', type: 'warning', date: new Date(Date.now() - 3600000).toISOString(), is_read: false },
    { id: '3', user_id: 'user1', message: 'Ordem de Compra #789 aprovada.', type: 'success', date: new Date(Date.now() - 7200000).toISOString(), is_read: true },
  ];
}

async function getSystemLogs(): Promise<any[]> { // Replace any with Log type
  console.log("Fetching system logs...");
  return [];
}

export default function NotificacoesPage() {
  // Fetch data client-side (example)
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [logs, setLogs] = React.useState<any[]>([]);

  React.useEffect(() => {
    getNotifications().then(setNotifications);
    // getSystemLogs().then(setLogs); // Fetch logs if needed for a separate view
  }, []);

  const markAllAsRead = () => {
    console.log("Marking all notifications as read (placeholder)...");
    // TODO: Implement API call to mark all as read
    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    alert("Marcar todas como lidas (placeholder)");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Notificações e Logs</h1>
         <Button onClick={markAllAsRead} variant="outline" size="sm" disabled={!notifications.some(n => !n.is_read)}>
            <CheckCheck className="mr-2 h-4 w-4" /> Marcar todas como lidas
        </Button>
      </div>

      {/* Using Card directly for notifications list for now */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" /> Notificações Recentes
          </CardTitle>
          <CardDescription>Alertas e atualizações importantes do sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-center py-5">Nenhuma notificação nova.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((notification) => (
                <li key={notification.id} className={`flex items-start p-3 rounded-md border ${notification.is_read ? 'bg-muted/50 opacity-70' : 'bg-background'}`}>
                  {/* TODO: Add icons based on type (info, warning, success, error) */}
                  <div className="flex-1 ml-3">
                    <p className={`text-sm ${notification.is_read ? 'text-muted-foreground' : 'font-medium'}`}>{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(notification.date).toLocaleString('pt-BR')}</p>
                  </div>
                  {!notification.is_read && (
                    <Button variant="ghost" size="sm" onClick={() => console.log(`Marking ${notification.id} as read (placeholder)`)} title="Marcar como lida">
                       <CheckCheck className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
           {/* TODO: Add pagination if list becomes long */}
        </CardContent>
      </Card>

      {/* Placeholder for System Logs - Could be a separate page or tab */}
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
             <History className="mr-2 h-5 w-5" /> Logs do Sistema (Em breve)
          </CardTitle>
          <CardDescription>Registro de ações importantes realizadas no sistema.</CardDescription>
        </CardHeader>
        <CardContent className="min-h-[200px]">
            <p className="text-muted-foreground text-center py-10">Visualização de logs do sistema será implementada aqui.</p>
             {/* <DataTable columns={logColumns} data={logs} /> */}
        </CardContent>
      </Card>

    </div>
  );
}

