"use client";

import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

// Define Zod schema for approval/rejection
const approvalSchema = z.object({
  notes: z.string().optional(),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

// Define the type based on your actual Supabase schema for purchase_requests
type PurchaseRequest = {
  id: string;
  created_at: string;
  requester_id?: string;
  department_id?: string;
  justification: string;
  status: "pending" | "approved" | "rejected";
};

interface PurchaseRequestApprovalDialogProps {
  purchaseRequest: PurchaseRequest;
  action: "approve" | "reject";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void; // Callback on successful update
}

export function PurchaseRequestApprovalDialog({ 
  purchaseRequest, 
  action,
  open, 
  onOpenChange, 
  onSuccess 
}: PurchaseRequestApprovalDialogProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      notes: "",
    },
  });

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      form.reset({ notes: "" });
    }
  }, [open, form]);

  async function onSubmit(values: ApprovalFormValues) {
    setIsLoading(true);
    const toastId = toast.loading(action === "approve" ? "Aprovando solicitação..." : "Rejeitando solicitação...");
    
    try {
      const newStatus = action === "approve" ? "approved" : "rejected";
      
      // 1. Update the purchase request status
      const { error: updateError } = await supabase
        .from("purchase_requests")
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq("id", purchaseRequest.id);

      if (updateError) throw updateError;

      // 2. Create a history entry for this status change
      const { error: historyError } = await supabase
        .from("purchase_request_history")
        .insert({
          purchase_request_id: purchaseRequest.id,
          status: newStatus,
          notes: values.notes || null,
          // created_by: user.id, // If you have user context
        });

      if (historyError) throw historyError;

      // 3. If approved, potentially create a purchase order (optional)
      if (action === "approve") {
        // This could be implemented later or as a separate action
        console.log("Solicitação aprovada. Implementação futura: criar ordem de compra automaticamente.");
      }

      toast.success(
        action === "approve" 
          ? "Solicitação aprovada com sucesso!" 
          : "Solicitação rejeitada com sucesso!", 
        { id: toastId }
      );
      
      onSuccess(); // Trigger data refresh and close dialog
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error(
        `Erro ao ${action === "approve" ? "aprovar" : "rejeitar"} solicitação: ${error instanceof Error ? error.message : String(error)}`, 
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {action === "approve" ? "Aprovar Solicitação" : "Rejeitar Solicitação"}
          </DialogTitle>
          <DialogDescription>
            {action === "approve" 
              ? "Confirme a aprovação da solicitação de compra." 
              : "Informe o motivo da rejeição da solicitação de compra."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={action === "approve" 
                        ? "Observações sobre a aprovação (opcional)" 
                        : "Motivo da rejeição (opcional)"}
                      {...field}
                      rows={4}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <DialogClose asChild>
                 <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button 
                type="submit" 
                disabled={isLoading}
                variant={action === "approve" ? "default" : "destructive"}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {action === "approve" ? "Aprovando..." : "Rejeitando..."}
                  </>
                ) : (
                  <>
                    {action === "approve" ? (
                      <><CheckCircle className="mr-2 h-4 w-4" /> Aprovar</>
                    ) : (
                      <><XCircle className="mr-2 h-4 w-4" /> Rejeitar</>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
