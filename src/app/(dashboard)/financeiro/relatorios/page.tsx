"use client";

import React from 'react';
import { FinancialReport } from "../_components/FinancialReport";
import { Metadata } from "next";

export default function FinancialReportsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
        <p className="text-muted-foreground mt-2">
          Visualize e analise as finanças da empresa com relatórios detalhados.
        </p>
      </div>
      
      <FinancialReport />
    </div>
  );
}
