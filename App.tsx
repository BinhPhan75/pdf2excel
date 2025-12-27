
import React, { useState } from 'react';
import { Layout } from './Layout';
import { Uploader } from './Uploader';
import { TablePreview } from './TablePreview';
import { AppState, ExtractedTable } from './types';
import { pdfToImages } from './pdfUtils';
import { extractTableFromImage } from './geminiService';
import { exportToExcel } from './excelUtils';
import { Loader2, CheckCircle2, AlertCircle, FileStack } from 'lucide-react';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const App: React.FC = () => {
  const [mergeAllSheets, setMergeAllSheets] = useState(false);
  const [state, setState] = useState<AppState>({
    file: null,
    tables: [],
    processing: {
      status: 'idle',
      message: '',
      progress: 0,
    },
  });

  const handleFileSelect = async (file: File) => {
    setState(prev => ({
      ...prev,
      file,
      tables: [],
      processing: { status: 'loading', message: 'Đang chuyển đổi PDF sang hình ảnh...', progress: 10 }
    }));

    try {
      const images = await pdfToImages(file);
      setState(prev => ({ 
        ...prev, 
        processing: { ...prev.processing, message: `Đang chuẩn bị xử lý ${images.length} trang...`, progress: 20 } 
      }));

      const allTables: ExtractedTable[] = [];
      for (let i = 0; i < images.length; i++) {
        // Update status for each page
        setState(prev => ({ 
          ...prev, 
          processing: { 
            ...prev.processing, 
            message: `Đang phân tích trang ${i + 1}/${images.length}...`, 
            progress: 20 + Math.floor((i / images.length) * 75) 
          } 
        }));
        
        try {
          const extracted = await extractTableFromImage(images[i]);
          if (extracted && extracted.length > 0) {
            allTables.push(...extracted);
          }
        } catch (pageError: any) {
          console.error(`Lỗi tại trang ${i + 1}:`, pageError);
          // If it's a fatal error (not 429 already handled by backoff), we show it
          if (pageError.message?.includes("API_KEY_INVALID")) throw pageError;
        }

        // Mandatory rest between pages to help stay within free tier limits (Gemini Flash free tier is tight)
        if (i < images.length - 1) {
          await sleep(1500); 
        }
      }

      if (allTables.length === 0) {
        throw new Error("Không tìm thấy bảng dữ liệu nào. Có thể do tài liệu không có bảng hoặc chất lượng hình ảnh quá thấp.");
      }

      setState(prev => ({
        ...prev,
        tables: allTables,
        processing: { status: 'success', message: `Xong! Tìm thấy ${allTables.length} bảng dữ liệu.`, progress: 100 }
      }));

      setTimeout(() => {
        setState(prev => ({ ...prev, processing: { ...prev.processing, status: 'idle' } }));
      }, 3000);

    } catch (error: any) {
      console.error("Processing Error:", error);
      let errorMsg = error.message || 'Lỗi không xác định khi gọi API.';
      if (errorMsg.includes("RESOURCE_EXHAUSTED")) {
        errorMsg = "Quá tải yêu cầu (Rate Limit). Vui lòng đợi 1 phút và thử lại với tệp ít trang hơn.";
      }
      
      setState(prev => ({
        ...prev,
        processing: { 
          status: 'error', 
          message: errorMsg, 
          progress: 0 
        }
      }));
    }
  };

  const handleDownload = () => {
    if (state.tables.length > 0) {
      const filename = (state.file?.name.replace('.pdf', '') || 'extracted_data') + 
                        (mergeAllSheets ? '_merged' : '') + '_ocr.xlsx';
      exportToExcel(state.tables, filename, mergeAllSheets);
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-12">
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            PDF sang Excel <span className="text-blue-600">Thông Minh</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Sử dụng công nghệ Gemini Vision OCR để chuyển đổi các bảng dữ liệu phức tạp từ PDF sang Excel với độ chính xác cao nhất.
          </p>
        </section>

        <section className="relative">
          <Uploader 
            onFileSelect={handleFileSelect} 
            disabled={state.processing.status === 'loading'} 
          />
          
          {state.processing.status !== 'idle' && (
            <div className={`mt-8 rounded-2xl border p-6 shadow-sm animate-in zoom-in duration-300 ${
              state.processing.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {state.processing.status === 'loading' && <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />}
                  {state.processing.status === 'success' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                  {state.processing.status === 'error' && <AlertCircle className="w-6 h-6 text-red-500" />}
                  <span className={`font-semibold text-lg ${
                    state.processing.status === 'error' ? 'text-red-700' : 'text-slate-800'
                  }`}>
                    {state.processing.message}
                  </span>
                </div>
                {state.processing.status === 'loading' && (
                  <span className="text-sm font-bold text-blue-600">{state.processing.progress}%</span>
                )}
              </div>
              
              {state.processing.status === 'loading' && (
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500 ease-out"
                    style={{ width: `${state.processing.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {state.tables.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <FileStack className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Tùy chọn xuất file</h2>
                  <p className="text-slate-500 text-sm">Cấu hình cách dữ liệu được tổ chức trong Excel</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl border border-slate-200 transition-colors flex-1 md:flex-none">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={mergeAllSheets}
                    onChange={(e) => setMergeAllSheets(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-slate-700 select-none">Gộp tất cả vào 1 sheet</span>
                </label>
              </div>
            </div>
            
            <TablePreview tables={state.tables} onDownload={handleDownload} />
          </section>
        )}

        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
          <FeatureCard 
            title="Sức mạnh AI"
            description="OCR thế hệ mới hiểu được cấu trúc bảng, các ô gộp và định dạng phức tạp."
            icon="✨"
          />
          <FeatureCard 
            title="An toàn dữ liệu"
            description="Dữ liệu được xử lý trực tiếp qua Gemini API. Chúng tôi không lưu trữ tệp tin của bạn."
            icon="🔒"
          />
          <FeatureCard 
            title="Độ chính xác cao"
            description="Hỗ trợ tốt cho cả tài liệu scan, ảnh chụp có chất lượng thấp hoặc bảng vẽ tay."
            icon="🎯"
          />
        </section>
      </div>
    </Layout>
  );
};

const FeatureCard: React.FC<{ title: string; description: string; icon: string }> = ({ title, description, icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="text-3xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
  </div>
);

export default App;
