"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

interface ExportOptions {
  data: any[];
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'pdf';
  columns?: { key: string; header: string }[];
}

export function ReportExporter({ 
  data, 
  fileName = 'relatorio', 
  fileType = 'csv',
  columns
}: ExportOptions) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error("Não há dados para exportar.");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading(`Preparando exportação em ${fileType.toUpperCase()}...`);

    try {
      // Determinar o nome do arquivo com data atual
      const timestamp = format(new Date(), "yyyy-MM-dd_HHmm");
      const fullFileName = `${fileName}_${timestamp}`;

      // Se não foram fornecidas colunas, usar as chaves do primeiro objeto
      const exportColumns = columns || 
        Object.keys(data[0]).map(key => ({ key, header: key }));

      // Preparar os dados para exportação
      const exportData = data.map(item => {
        const row: Record<string, any> = {};
        exportColumns.forEach(col => {
          row[col.header] = item[col.key];
        });
        return row;
      });

      // Exportar de acordo com o tipo de arquivo
      switch (fileType) {
        case 'csv':
          exportToCSV(exportData, fullFileName, exportColumns);
          break;
        case 'xlsx':
          exportToXLSX(exportData, fullFileName, exportColumns);
          break;
        case 'pdf':
          await exportToPDF(exportData, fullFileName, exportColumns);
          break;
      }

      toast.success(`Relatório exportado com sucesso!`, { id: toastId });
    } catch (error: any) {
      console.error(`Erro ao exportar ${fileType}:`, error);
      toast.error(`Falha na exportação: ${error.message}`, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Exportar para CSV
  const exportToCSV = (
    data: Record<string, any>[], 
    fileName: string,
    columns: { key: string; header: string }[]
  ) => {
    // Cabeçalhos do CSV
    const headers = columns.map(col => col.header).join(",");
    
    // Linhas do CSV
    const rows = data.map(row => 
      columns.map(col => {
        const value = row[col.header];
        // Escapar aspas e formatar valores
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        } else if (value instanceof Date) {
          return `"${format(value, 'dd/MM/yyyy')}"`;
        } else if (typeof value === 'number') {
          return value.toString().replace('.', ',');
        }
        return value || '';
      }).join(",")
    );
    
    // Montar o conteúdo completo do CSV
    const csvContent = [headers, ...rows].join("\n");
    
    // Criar um blob e link para download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${fileName}.csv`);
  };

  // Exportar para XLSX
  const exportToXLSX = (
    data: Record<string, any>[], 
    fileName: string,
    columns: { key: string; header: string }[]
  ) => {
    // Criar uma nova planilha
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Definir cabeçalhos personalizados
    XLSX.utils.sheet_add_aoa(worksheet, [columns.map(col => col.header)], { origin: 'A1' });
    
    // Criar um novo workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório');
    
    // Gerar o arquivo e fazer download
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  };

  // Exportar para PDF
  const exportToPDF = async (
    data: Record<string, any>[], 
    fileName: string,
    columns: { key: string; header: string }[]
  ) => {
    // Simulação de exportação para PDF
    // Em um ambiente real, usaríamos uma biblioteca como jsPDF ou pdfmake
    // ou enviaríamos os dados para um endpoint de servidor que geraria o PDF
    
    // Simular um atraso para demonstrar o processo
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Criar um HTML simples para demonstração
    const tableHeaders = columns.map(col => `<th>${col.header}</th>`).join('');
    const tableRows = data.map(row => {
      const cells = columns.map(col => `<td>${row[col.header] || ''}</td>`).join('');
      return `<tr>${cells}</tr>`;
    }).join('');
    
    const html = `
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          <h1>${fileName}</h1>
          <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </body>
      </html>
    `;
    
    // Criar um blob e link para download (apenas para demonstração)
    const blob = new Blob([html], { type: 'text/html' });
    saveAs(blob, `${fileName}.html`);
    
    // Mostrar mensagem explicativa
    toast.info("Exportação para PDF simulada. Em um ambiente de produção, seria gerado um PDF real.");
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting || !data || data.length === 0}
      className="flex items-center gap-2"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Exportando...
        </>
      ) : (
        <>
          {fileType === 'csv' && <Download className="h-4 w-4" />}
          {fileType === 'xlsx' && <FileText className="h-4 w-4" />}
          {fileType === 'pdf' && <FileText className="h-4 w-4" />}
          Exportar {fileType.toUpperCase()}
        </>
      )}
    </Button>
  );
}
