"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table"; // Assuming a reusable DataTable component exists
import { purchaseRequestColumns } from "./_components/PurchaseRequestColumns"; // We will create this next
import { PurchaseRequestForm } from "./_components/PurchaseRequestForm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

// TODO: Define the type based on your actual Supabase schema for purchase_requests
type PurchaseRequest = {
  id: string;
  created_at: string;
  requester_id?: string; // Link to users table
  department?: string;
  justification: string;
  status: "pending" | "approved" | "rejected";
  // Add other relevant fields like items, total_value, etc.
};

export default function PurchaseRequestsPage() {
  const supabase = createClient();
  const [data, setData] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  async function fetchData() {
    setLoading(true);
    const { data: requests, error } = await supabase
      .from("purchase_requests") // TODO: Verify table name
      .select("*" ) // Adjust columns as needed, potentially join with user names
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching purchase requests:", error);
      toast.error("Erro ao buscar solicitações de compra.");
      setData([]);
    } else {
      setData(requests || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchData(); // Refresh data after successful form submission
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Solicitações de Compra</h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Nova Solicitação de Compra</DialogTitle>
              <DialogDescription>
                Preencha os detalhes da sua solicitação.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <PurchaseRequestForm onSuccess={handleFormSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* TODO: Add AdvancedFilters component if needed */}

      <DataTable
        columns={purchaseRequestColumns} // We will define these columns next
        data={data}
        loading={loading}
        filterColumn="justification" // Or another searchable column
        filterPlaceholder="Buscar por justificativa..."
      />
    </div>
  );
}

