
import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface UploaderProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const validateAndSelectFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Vui lòng chọn tệp định dạng PDF.');
      return;
    }
    // Đã gỡ bỏ giới hạn dung lượng tệp theo yêu cầu
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) validateAndSelectFile(file);
  }, [disabled, onFileSelect]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelectFile(file);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-200 flex flex-col items-center justify-center text-center
          ${isDragging ? 'border-blue-500 bg-blue-50/50 scale-[1.01]' : 'border-slate-300 hover:border-slate-400 bg-white'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleFileInput}
          accept=".pdf"
          disabled={disabled}
        />
        
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 transition-colors
          ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}
        `}>
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          {isDragging ? 'Thả tệp PDF vào đây' : 'Tải lên tệp PDF của bạn'}
        </h3>
        <p className="text-slate-500 max-w-xs mx-auto mb-6">
          Kéo và thả tệp vào đây, hoặc nhấn để chọn tệp. Các bảng dữ liệu sẽ được trích xuất tự động.
        </p>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <FileText className="w-3.5 h-3.5" />
            Chỉ nhận PDF
          </div>
          <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
            Không giới hạn dung lượng
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
