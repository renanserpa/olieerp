"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  ShoppingBag, 
  Package, 
  Clipboard, 
  BarChart2, 
  Settings, 
  Truck, 
  DollarSign,
  Layers,
  Wrench, // Substituído Tool por Wrench
  Box,
  Grid,
  UserPlus,
  Briefcase
} from 'lucide-react';

const Sidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: <Home className="w-5 h-5" /> }, // Corrigido de '/dashboard' para '/'
    { name: 'Clientes', href: '/clientes', icon: <Users className="w-5 h-5" /> },
    { name: 'Fornecedores', href: '/fornecedores', icon: <UserPlus className="w-5 h-5" /> },
    { name: 'Produtos', href: '/produtos', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Pedidos', href: '/pedidos', icon: <Clipboard className="w-5 h-5" /> },
    { name: 'Estoque', href: '/estoque', icon: <Package className="w-5 h-5" /> },
    { name: 'Componentes', href: '/componentes', icon: <Layers className="w-5 h-5" /> },
    { name: 'Insumos', href: '/insumos', icon: <Wrench className="w-5 h-5" /> }, // Substituído Tool por Wrench
    { name: 'Kits', href: '/kits', icon: <Grid className="w-5 h-5" /> },
    { name: 'Produção', href: '/producao', icon: <Box className="w-5 h-5" /> },
    { name: 'Compras', href: '/compras', icon: <ShoppingBag className="w-5 h-5" /> },
    { name: 'Logística', href: '/logistica', icon: <Truck className="w-5 h-5" /> },
    { name: 'Financeiro', href: '/financeiro', icon: <DollarSign className="w-5 h-5" /> },
    { name: 'RH', href: '/rh', icon: <Briefcase className="w-5 h-5" /> },
    { name: 'BI', href: '/bi', icon: <BarChart2 className="w-5 h-5" /> },
    { name: 'Configurações', href: '/configuracoes', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <div className="h-full flex flex-col bg-white border-r shadow-sm">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-center">Olie ERP</h2>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <nav className="px-2 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin</p>
            <p className="text-xs text-gray-500">admin@atelieolie.com.br</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
