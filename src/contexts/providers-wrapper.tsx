"use client";

import React, { ReactNode } from 'react';
import { NotificationProvider } from './notification-context-fallback';

interface ProvidersWrapperProps {
  children: ReactNode;
}

/**
 * Componente wrapper que agrupa todos os providers necessários para a aplicação
 * Isso garante que todos os componentes tenham acesso a todos os contextos necessários
 * independentemente de onde estejam na árvore de componentes
 */
export const ProvidersWrapper: React.FC<ProvidersWrapperProps> = ({ children }) => {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
};

export default ProvidersWrapper;
