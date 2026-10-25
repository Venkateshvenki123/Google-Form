import React from 'react';
import { Link, Outlet, useSearchParams } from 'react-router-dom';
import { FileCheck2, ShieldCheck, ArrowRight } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';

  if (isEmbedded) {
    // Render without header and footer for iframe embedding
    return (
      <div className="min-h-screen bg-transparent">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-800">
      {/* Public Top Nav */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/80 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/forms" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">FormCraft Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/forms"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Directory
            </Link>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Admin Panel</span>
              <ArrowRight className="w-3 h-3 text-gray-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Public Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Public Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-center text-xs text-gray-400">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500 font-medium">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>Powered by FormCraft Dynamic Engine</span>
          </div>
          <p>© {new Date().getFullYear()} FormCraft Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
