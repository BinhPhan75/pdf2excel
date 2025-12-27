
import React from 'react';
import { ExtractedTable } from './types';
import { Download, Table as TableIcon } from 'lucide-react';

interface TablePreviewProps {
  tables: ExtractedTable[];
  onDownload: () => void;
}

export const TablePreview: React.FC<TablePreviewProps> = ({ tables, onDownload }) => {
  if (tables.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Xem trước dữ liệu</h2>
          <p className="text-slate-500 text-sm">Tìm thấy {tables.length} bảng trong tài liệu.</p>
        </div>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5"
        >
          <Download className="w-5 h-5" />
          Tải file Excel
        </button>
      </div>

      <div className="space-y-6">
        {tables.map((table, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-3">
              <TableIcon className="w-4 h-4 text-slate-400" />
              <h3 className="font-semibold text-slate-800 text-sm">{table.tableName || `Bảng ${idx + 1}`}</h3>
              <span className="text-[10px] font-bold text-slate-400 ml-auto bg-white border border-slate-200 px-2 py-0.5 rounded-full uppercase">
                {table.rows.length} hàng
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50/50 border-b border-slate-200">
                  <tr>
                    {table.headers.map((header, hIdx) => (
                      <th key={hIdx} className="px-4 py-3 font-semibold text-slate-700 uppercase tracking-wider text-[10px] whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {table.rows.slice(0, 5).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                      {table.headers.map((header, hIdx) => (
                        <td key={hIdx} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {String(row[header] || '-')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.rows.length > 5 && (
                <div className="p-3 text-center bg-slate-50/30 border-t border-slate-100">
                  <p className="text-slate-400 text-[10px] italic">
                    Đang hiển thị 5 hàng đầu tiên. Tải file để xem đầy đủ {table.rows.length} hàng.
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
