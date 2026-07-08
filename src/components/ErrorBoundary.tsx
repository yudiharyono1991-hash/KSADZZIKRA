import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-lg w-full border border-red-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertOctagon className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 mb-2">Sistem Mengalami Kendala</h1>
            <p className="text-slate-500 mb-6 text-sm">
              Kami mendeteksi anomali pada sistem yang mencegah halaman ini ditampilkan. Anda dapat mencoba memuat ulang halaman.
            </p>
            
            <div className="bg-slate-100 rounded-xl p-4 mb-6 text-left overflow-x-auto">
              <p className="font-mono text-xs text-slate-700 whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown error occurred'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={this.handleReload}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-5 h-5" /> Muat Ulang Sistem
              </button>
              <button 
                onClick={this.handleResetToHome}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home className="w-5 h-5" /> Ke Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (this as any).props.children as ReactNode;
  }
}
