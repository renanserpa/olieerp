"use client";

import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/contexts/auth-context";

// Tipos para o sistema de auditoria
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'VIEW' 
  | 'EXPORT' 
  | 'IMPORT' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'STATUS_CHANGE'
  | 'PERMISSION_CHANGE';

export type AuditLog = {
  id: string;
  user_id: string | null;
  action_type: AuditAction;
  entity_type: string;
  entity_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

// Classe para gerenciar auditoria
export class AuditService {
  private supabase = createClient();
  private userId: string | null = null;
  
  constructor(userId?: string) {
    this.userId = userId || null;
  }
  
  // Definir ID do usuário
  setUserId(userId: string | null) {
    this.userId = userId;
  }
  
  // Registrar evento de auditoria
  async logEvent(
    action: AuditAction,
    entityType: string,
    entityId: string | null = null,
    details: any = {},
  ): Promise<void> {
    try {
      // Obter informações do navegador
      const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : null;
      
      // Criar registro de auditoria
      const { error } = await this.supabase
        .from('audit_logs')
        .insert({
          user_id: this.userId,
          action_type: action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          user_agent: userAgent,
          // IP será capturado pelo backend via RLS ou função
        });
        
      if (error) {
        console.error("Erro ao registrar evento de auditoria:", error);
      }
    } catch (error) {
      console.error("Erro ao registrar evento de auditoria:", error);
    }
  }
  
  // Buscar logs de auditoria (para administradores)
  async getAuditLogs(
    options: {
      userId?: string;
      actionType?: AuditAction;
      entityType?: string;
      entityId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{ data: AuditLog[] | null; count: number | null; error: any }> {
    try {
      // Construir query
      let query = this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact' });
        
      // Aplicar filtros
      if (options.userId) {
        query = query.eq('user_id', options.userId);
      }
      
      if (options.actionType) {
        query = query.eq('action_type', options.actionType);
      }
      
      if (options.entityType) {
        query = query.eq('entity_type', options.entityType);
      }
      
      if (options.entityId) {
        query = query.eq('entity_id', options.entityId);
      }
      
      if (options.startDate) {
        query = query.gte('created_at', options.startDate.toISOString());
      }
      
      if (options.endDate) {
        query = query.lte('created_at', options.endDate.toISOString());
      }
      
      // Aplicar paginação
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }
      
      // Ordenar por data (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });
      
      // Executar query
      const { data, error, count } = await query;
      
      return { data, count, error };
    } catch (error) {
      console.error("Erro ao buscar logs de auditoria:", error);
      return { data: null, count: null, error };
    }
  }
  
  // Obter detalhes de um log específico
  async getAuditLogDetails(logId: string): Promise<{ data: AuditLog | null; error: any }> {
    try {
      const { data, error } = await this.supabase
        .from('audit_logs')
        .select('*')
        .eq('id', logId)
        .single();
        
      return { data, error };
    } catch (error) {
      console.error("Erro ao buscar detalhes do log:", error);
      return { data: null, error };
    }
  }
}

// Hook para usar o serviço de auditoria
export const useAudit = () => {
  const { user } = useAuth();
  const auditService = new AuditService(user?.id);
  
  return auditService;
};

// Função para criar instância do serviço de auditoria (para uso em componentes não-React)
export const createAuditService = (userId?: string) => {
  return new AuditService(userId);
};
