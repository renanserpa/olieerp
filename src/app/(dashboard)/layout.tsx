"use client";

import React from 'react';
import { usePathname } from 'next/navigation';

// Importando o componente Sidebar com caminho absoluto
import SidebarComponent from '@/components/layout/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname();
  
  // Verificar se estamos na página de login
  const isLoginPage = pathname === '/login';
  
  if (isLoginPage) {
    return <>{children}</>;
  }
  
  return (
    <div className="flex h-screen">
      <div className="w-64 h-full">
        <SidebarComponent />
      </div>
      <div className="flex-1 overflow-auto">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
