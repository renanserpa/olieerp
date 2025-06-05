"use client";

import { toast } from "@/components/ui/use-toast";

/**
 * Manipulador de erros centralizado para o sistema ERP Olie
 * Padroniza o tratamento de erros em toda a aplicação
 */
export class ErrorHandler {
  /**
   * Trata erros do Supabase de forma padronizada
   * @param error Objeto de erro do Supabase
   * @param customMessage Mensagem personalizada opcional
   * @returns Mensagem de erro formatada
   */
  static handleSupabaseError(error: any, customMessage?: string): string {
    console.error("Erro Supabase:", error);
    
    // Mensagem padrão
    let message = customMessage || "Ocorreu um erro ao processar sua solicitação.";
    
    // Verificar se é um erro do Supabase
    if (error && error.code) {
      switch (error.code) {
        case "PGRST116":
          message = "Registro não encontrado.";
          break;
        case "23505":
          message = "Este registro já existe. Verifique os dados e tente novamente.";
          break;
        case "23503":
          message = "Não é possível excluir este registro pois ele está sendo usado em outros lugares.";
          break;
        case "42P01":
          message = "Tabela não encontrada. Entre em contato com o suporte.";
          break;
        case "42703":
          message = "Coluna não encontrada. Entre em contato com o suporte.";
          break;
        case "auth/invalid-email":
          message = "Email inválido. Verifique e tente novamente.";
          break;
        case "auth/user-not-found":
          message = "Usuário não encontrado.";
          break;
        case "auth/wrong-password":
          message = "Senha incorreta.";
          break;
        default:
          // Se tiver uma mensagem de erro, usar ela
          if (error.message) {
            message = `Erro: ${error.message}`;
          }
      }
    }
    
    // Exibir toast com o erro
    toast({
      title: "Erro",
      description: message,
      variant: "destructive",
    });
    
    return message;
  }
  
  /**
   * Trata erros genéricos da aplicação
   * @param error Objeto de erro
   * @param customMessage Mensagem personalizada opcional
   * @returns Mensagem de erro formatada
   */
  static handleError(error: any, customMessage?: string): string {
    console.error("Erro:", error);
    
    // Mensagem padrão
    let message = customMessage || "Ocorreu um erro ao processar sua solicitação.";
    
    // Se for um erro com mensagem, usar a mensagem
    if (error && error.message) {
      message = error.message;
    }
    
    // Exibir toast com o erro
    toast({
      title: "Erro",
      description: message,
      variant: "destructive",
    });
    
    return message;
  }
  
  /**
   * Trata erros de validação de formulários
   * @param errors Objeto de erros de validação
   * @returns Mensagem de erro formatada
   */
  static handleValidationErrors(errors: Record<string, string[]>): string {
    console.error("Erros de validação:", errors);
    
    // Extrair todas as mensagens de erro
    const errorMessages = Object.values(errors).flat();
    
    // Criar uma única mensagem com todos os erros
    const message = errorMessages.join(". ");
    
    // Exibir toast com o erro
    toast({
      title: "Erro de validação",
      description: message,
      variant: "destructive",
    });
    
    return message;
  }
}
