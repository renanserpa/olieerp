"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, Menu, Package, Users, ShoppingCart, Factory, 
  Boxes, ShoppingBag, Building, Truck, DollarSign, BarChart, 
  Settings, LogOut, ChevronDown, ChevronRight
} from 'lucide-react';

// Mapeamento de ícones por nome
const iconMap: Record<string, React.ReactNode> = {
  'LayoutDashboard': <LayoutDashboard className="h-5 w-5" />,
  'Package': <Package className="h-5 w-5" />,
  'Users': <Users className="h-5 w-5" />,
  'ShoppingCart': <ShoppingCart className="h-5 w-5" />,
  'Factory': <Factory className="h-5 w-5" />,
  'Boxes': <Boxes className="h-5 w-5" />,
  'ShoppingBag': <ShoppingBag className="h-5 w-5" />,
  'Building': <Building className="h-5 w-5" />,
  'Truck': <Truck className="h-5 w-5" />,
  'DollarSign': <DollarSign className="h-5 w-5" />,
  'BarChart': <BarChart className="h-5 w-5" />,
  'Settings': <Settings className="h-5 w-5" />
};

// Componente de item do menu
interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  isChild?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  isDisabled?: boolean;
}

const NavItem = ({
  href,
  icon,
  title,
  isActive,
  isChild = false,
  hasChildren = false,
  isExpanded = false,
  onToggleExpand,
  isDisabled = false
}: NavItemProps) => {
  const content = (
    <div
      className={cn(
        "flex items-center gap-x-2 py-2 px-3 rounded-md text-sm font-medium",
        isChild ? "pl-10" : "",
        isActive 
          ? "bg-primary/10 text-primary" 
          : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      {icon}
      <span className="flex-1">{title}</span>
      {hasChildren && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 p-0" 
          onClick={(e) => {
            e.preventDefault();
            onToggleExpand?.();
          }}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );

  if (isDisabled || (hasChildren && !isChild)) {
    return (
      <div className={cn("cursor-pointer", isDisabled && "cursor-not-allowed")}>
        {content}
      </div>
    );
  }

  return (
    <Link href={href}>
      {content}
    </Link>
  );
};

// Componente principal de navegação
export function MainNav() {
  const pathname = usePathname();
  const { modules, hasPermission, hasRole } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Função para verificar se um caminho está ativo
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Função para alternar expansão de itens com submenus
  const toggleExpand = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Renderizar itens do menu com base nos módulos acessíveis
  const renderNavItems = () => {
    return modules.map(module => {
      // Verificar se o módulo tem ícone mapeado
      const icon = iconMap[module.icon] || <Menu className="h-5 w-5" />;
      
      // Verificar se o módulo está ativo
      const active = isActive(module.path);
      
      // Verificar se o módulo está expandido
      const isExpanded = !!expandedItems[module.path];
      
      // Verificar se o módulo tem submódulos (exemplo para Financeiro)
      const hasSubmenu = module.name === 'Financeiro' || module.name === 'Produtos' || module.name === 'Estoque';
      
      // Renderizar item do menu
      return (
        <div key={module.id}>
          <NavItem
            href={module.path}
            icon={icon}
            title={module.name}
            isActive={active}
            hasChildren={hasSubmenu}
            isExpanded={isExpanded}
            onToggleExpand={() => toggleExpand(module.path)}
          />
          
          {/* Submenu para Financeiro */}
          {module.name === 'Financeiro' && isExpanded && (
            <>
              <NavItem
                href="/financeiro/categorias"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Categorias"
                isActive={isActive('/financeiro/categorias')}
                isChild
                isDisabled={!hasPermission('financial.view')}
              />
              <NavItem
                href="/financeiro/formas-pagamento"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Formas de Pagamento"
                isActive={isActive('/financeiro/formas-pagamento')}
                isChild
                isDisabled={!hasPermission('financial.view')}
              />
              <NavItem
                href="/financeiro/relatorios"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Relatórios"
                isActive={isActive('/financeiro/relatorios')}
                isChild
                isDisabled={!hasPermission('financial.reports.view')}
              />
            </>
          )}
          
          {/* Submenu para Produtos */}
          {module.name === 'Produtos' && isExpanded && (
            <>
              <NavItem
                href="/produtos"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Todos os Produtos"
                isActive={pathname === '/produtos'}
                isChild
                isDisabled={!hasPermission('products.view')}
              />
              <NavItem
                href="/produtos/categorias"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Categorias"
                isActive={isActive('/produtos/categorias')}
                isChild
                isDisabled={!hasPermission('products.view')}
              />
            </>
          )}
          
          {/* Submenu para Estoque */}
          {module.name === 'Estoque' && isExpanded && (
            <>
              <NavItem
                href="/estoque"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Visão Geral"
                isActive={pathname === '/estoque'}
                isChild
              />
              <NavItem
                href="/estoque/movimentacoes"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Movimentações"
                isActive={isActive('/estoque/movimentacoes')}
                isChild
              />
              <NavItem
                href="/estoque/grupos"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Grupos"
                isActive={isActive('/estoque/grupos')}
                isChild
              />
              <NavItem
                href="/estoque/localizacoes"
                icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
                title="Localizações"
                isActive={isActive('/estoque/localizacoes')}
                isChild
              />
            </>
          )}
        </div>
      );
    });
  };

  // Renderizar menu de configurações (apenas para admin)
  const renderSettingsMenu = () => {
    if (!hasRole('admin')) return null;
    
    return (
      <div>
        <NavItem
          href="/configuracoes"
          icon={<Settings className="h-5 w-5" />}
          title="Configurações"
          isActive={isActive('/configuracoes')}
          hasChildren={true}
          isExpanded={!!expandedItems['/configuracoes']}
          onToggleExpand={() => toggleExpand('/configuracoes')}
        />
        
        {expandedItems['/configuracoes'] && (
          <>
            <NavItem
              href="/configuracoes/usuarios"
              icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
              title="Usuários"
              isActive={isActive('/configuracoes/usuarios')}
              isChild
              isDisabled={!hasPermission('users.manage')}
            />
            <NavItem
              href="/configuracoes/permissoes"
              icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
              title="Permissões"
              isActive={isActive('/configuracoes/permissoes')}
              isChild
              isDisabled={!hasPermission('permissions.manage')}
            />
            <NavItem
              href="/configuracoes/auditoria"
              icon={<div className="w-5 h-5 flex items-center justify-center">•</div>}
              title="Logs de Auditoria"
              isActive={isActive('/configuracoes/auditoria')}
              isChild
              isDisabled={!hasPermission('permissions.manage')}
            />
          </>
        )}
      </div>
    );
  };

  // Versão desktop da navegação
  const DesktopNav = () => (
    <div className="hidden md:flex flex-col h-full">
      <ScrollArea className="flex-1 py-2">
        <div className="space-y-1 px-2">
          {renderNavItems()}
          {renderSettingsMenu()}
        </div>
      </ScrollArea>
    </div>
  );

  // Versão mobile da navegação
  const MobileNav = () => (
    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <ScrollArea className="h-full py-6">
          <div className="space-y-1 px-2">
            {renderNavItems()}
            {renderSettingsMenu()}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );

  return (
    <>
      <DesktopNav />
      <MobileNav />
    </>
  );
}
