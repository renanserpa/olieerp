"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

interface ClipboardCopyProps {
  value: string;
  onCopy?: () => void;
  className?: string;
  buttonText?: string;
  showInput?: boolean;
}

/**
 * ClipboardCopy - Um componente para copiar texto para a área de transferência
 * com fallback para navegadores que não suportam a API Clipboard
 */
export function ClipboardCopy({
  value,
  onCopy,
  className,
  buttonText = "Copiar",
  showInput = false,
}: ClipboardCopyProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        // Usar a API Clipboard quando disponível em contexto seguro
        await navigator.clipboard.writeText(value);
        setHasCopied(true);
        toast.success("Copiado para a área de transferência!");
        onCopy?.();
        
        setTimeout(() => {
          setHasCopied(false);
        }, 2000);
      } else {
        // Fallback para navegadores que não suportam a API Clipboard
        setShowFallback(true);
        
        // Selecionar o texto automaticamente para facilitar a cópia
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.select();
            toast.info("Selecione o texto e use Ctrl+C para copiar");
          }
        }, 100);
      }
    } catch (error) {
      console.error("Erro ao copiar para a área de transferência:", error);
      setShowFallback(true);
      toast.error("Não foi possível copiar automaticamente");
      
      // Selecionar o texto automaticamente para facilitar a cópia
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select();
          toast.info("Selecione o texto e use Ctrl+C para copiar");
        }
      }, 100);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {(showInput || showFallback) && (
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            ref={inputRef}
            value={value}
            readOnly
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="font-mono text-sm"
          />
          <Button type="button" onClick={copyToClipboard} size="sm">
            {hasCopied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}
      
      {!showInput && !showFallback && (
        <Button
          type="button"
          onClick={copyToClipboard}
          size="sm"
          variant="outline"
          className="gap-1"
        >
          {hasCopied ? (
            <>
              <Check className="h-4 w-4" />
              Copiado!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              {buttonText}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
