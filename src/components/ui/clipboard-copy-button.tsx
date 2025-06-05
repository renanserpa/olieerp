"use client";

import React from 'react';
import { ClipboardCopy } from './clipboard-copy';
import { toast } from 'sonner';

interface ClipboardCopyButtonProps {
  value: string;
  buttonText?: string;
  className?: string;
  showInput?: boolean;
  onCopy?: () => void;
}

/**
 * ClipboardCopyButton - Componente aprimorado para copiar texto para a área de transferência
 * com tratamento de erros e fallback para navegadores sem suporte à API Clipboard
 */
export function ClipboardCopyButton({
  value,
  buttonText = "Copiar",
  className,
  showInput = false,
  onCopy
}: ClipboardCopyButtonProps) {
  const handleCopy = () => {
    try {
      // Usar o componente ClipboardCopy para lidar com a cópia
      // Notificar o usuário sobre o sucesso
      toast.success("Copiado para a área de transferência!");
      
      // Executar callback se fornecido
      if (onCopy) {
        onCopy();
      }
    } catch (error) {
      console.error("Erro ao copiar para a área de transferência:", error);
      toast.error("Não foi possível copiar automaticamente. Por favor, copie manualmente.");
    }
  };

  return (
    <ClipboardCopy 
      value={value}
      buttonText={buttonText}
      className={className}
      showInput={showInput}
      onCopy={onCopy}
    />
  );
}
