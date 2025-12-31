
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
      setError('Please select a PDF file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      setError('File size exceeds 20MB. Please choose a smaller file.');
      return;
    }
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
          {isDragging ? 'Drop your PDF here' : 'Upload your PDF'}
        </h3>
        <p className="text-slate-500 max-w-xs mx-auto mb-6">
          Drag and drop your file here, or click to browse. Tables will be extracted automatically.
        </p>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            <FileText className="w-3.5 h-3.5" />
            PDF Only
          </div>
          <div className="px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100">
            Max 20MB
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
