
import React from 'react';
import { FileSpreadsheet, FileText, Settings } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <FileSpreadsheet className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Gemini PDF-to-Excel</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Powered by Gemini OCR</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">How it works</a>
            <a href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">API docs</a>
            <button className="p-2 text-slate-400 hover:text-slate-600">
              <Settings className="w-5 h-5" />
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Advanced OCR Conversion Tool. Built with Google Gemini API.
          </p>
        </div>
      </footer>
    </div>
  );
};
