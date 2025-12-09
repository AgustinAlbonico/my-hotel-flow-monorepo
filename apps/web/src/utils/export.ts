/**
 * Export Utilities - Funciones para exportar datos a PDF y Excel
 * Fase 3 - UI/UX: Sistema de exportación
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
}

/**
 * Exportar datos a PDF
 */
export const exportToPDF = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions
): void => {
  const { filename, title, subtitle, orientation = 'portrait' } = options;

  // Crear documento PDF
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Agregar título
  if (title) {
    doc.setFontSize(18);
    doc.text(title, 14, 20);
  }

  // Agregar subtítulo
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(subtitle, 14, title ? 28 : 20);
  }

  // Preparar datos para la tabla
  const headers = columns.map((col) => col.header);
  const body = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      
      // Formatear valores especiales
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Sí' : 'No';
      if (value instanceof Date) return value.toLocaleDateString('es-AR');
      if (typeof value === 'object') return JSON.stringify(value);
      
      return String(value);
    })
  );

  // Generar tabla
  autoTable(doc, {
    head: [headers],
    body,
    startY: title && subtitle ? 35 : title ? 28 : 15,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [37, 99, 235], // primary-600
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    margin: { top: 10, right: 10, bottom: 10, left: 10 },
  });

  // Agregar pie de página con fecha y página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Generado: ${new Date().toLocaleDateString('es-AR')} - Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.height - 10
    );
  }

  // Descargar PDF
  doc.save(`${filename}.pdf`);
};

/**
 * Exportar datos a Excel
 */
export const exportToExcel = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions
): void => {
  const { filename, title } = options;

  // Preparar datos con headers
  const headers = columns.reduce((acc, col) => {
    acc[col.key] = col.header;
    return acc;
  }, {} as Record<string, string>);

  // Formatear datos
  const formattedData = data.map((row) => {
    const formattedRow: Record<string, any> = {};
    columns.forEach((col) => {
      const value = row[col.key];
      
      // Formatear valores especiales
      if (value === null || value === undefined) {
        formattedRow[col.key] = '-';
      } else if (typeof value === 'boolean') {
        formattedRow[col.key] = value ? 'Sí' : 'No';
      } else if (value instanceof Date) {
        formattedRow[col.key] = value.toLocaleDateString('es-AR');
      } else if (typeof value === 'object') {
        formattedRow[col.key] = JSON.stringify(value);
      } else {
        formattedRow[col.key] = value;
      }
    });
    return formattedRow;
  });

  // Combinar headers con datos
  const worksheetData = [headers, ...formattedData];

  // Crear workbook y worksheet
  const worksheet = XLSX.utils.json_to_sheet(worksheetData, {
    skipHeader: true,
  });

  // Establecer anchos de columnas
  const columnWidths = columns.map((col) => ({
    wch: col.width || 15,
  }));
  worksheet['!cols'] = columnWidths;

  // Crear workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title || 'Datos');

  // Descargar Excel
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Exportar a CSV (simple)
 */
export const exportToCSV = <T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  options: ExportOptions
): void => {
  const { filename } = options;

  // Crear headers
  const headers = columns.map((col) => col.header).join(',');

  // Crear filas
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        
        // Formatear y escapar valores
        let formatted = '';
        if (value === null || value === undefined) {
          formatted = '';
        } else if (typeof value === 'string') {
          // Escapar comillas y comas
          formatted = `"${value.replace(/"/g, '""')}"`;
        } else if (value instanceof Date) {
          formatted = value.toLocaleDateString('es-AR');
        } else {
          formatted = String(value);
        }
        
        return formatted;
      })
      .join(',')
  );

  // Combinar todo
  const csv = [headers, ...rows].join('\n');

  // Crear blob y descargar
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
