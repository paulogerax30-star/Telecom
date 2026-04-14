import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h2>
          <p className="text-slate-500 max-w-md mb-8">
            Ocorreu um erro inesperado na interface. Tente recarregar a página ou voltar para o início.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar
            </button>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all"
            >
              Tentar Novamente
            </button>
          </div>
          {this.state.error && (
            <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100 text-left w-full max-w-lg">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Detalhes técnicos:</p>
              <p className="text-xs font-mono text-slate-500 break-all">{this.state.error.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
