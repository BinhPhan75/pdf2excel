
import * as XLSX from 'xlsx';
import { ExtractedTable } from '../types';

export const exportToExcel = (tables: ExtractedTable[], filename: string = 'extracted_data.xlsx', mergeAll: boolean = false) => {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  if (mergeAll && tables.length > 0) {
    // Merge logic
    const allRows = tables.flatMap(table => table.rows);
    const worksheet = XLSX.utils.json_to_sheet(allRows);
    
    // Auto-size columns for the merged sheet
    const allHeaders = Array.from(new Set(tables.flatMap(t => t.headers)));
    if (allHeaders.length > 0) {
      const maxWidths = allHeaders.map(h => {
        let maxLen = h.length;
        allRows.slice(0, 100).forEach(row => { // Sample first 100 rows for performance
          const val = String(row[h] || '');
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(maxLen + 2, 50) };
      });
      worksheet['!cols'] = maxWidths;
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Combined Data");
  } else {
    // Separate sheets logic (existing)
    tables.forEach((table, index) => {
      let baseName = (table.tableName || `Sheet ${index + 1}`)
        .replace(/[\\/?*[\]]/g, '')
        .trim();
      
      if (!baseName) baseName = `Table ${index + 1}`;

      let sheetName = baseName.substring(0, 31);
      let counter = 1;
      
      while (usedNames.has(sheetName)) {
        const suffix = `_${counter}`;
        const maxBaseLength = 31 - suffix.length;
        sheetName = baseName.substring(0, maxBaseLength) + suffix;
        counter++;
      }
      
      usedNames.add(sheetName);

      const worksheet = XLSX.utils.json_to_sheet(table.rows);
      
      if (table.headers && table.headers.length > 0) {
        const maxWidths = table.headers.map(h => {
            let maxLen = h.length;
            table.rows.forEach(row => {
                const val = String(row[h] || '');
                if (val.length > maxLen) maxLen = val.length;
            });
            return { wch: Math.min(maxLen + 2, 50) };
        });
        worksheet['!cols'] = maxWidths;
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
  }

  XLSX.writeFile(workbook, filename);
};
