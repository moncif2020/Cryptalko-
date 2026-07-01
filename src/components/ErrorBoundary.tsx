import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-[#1a1212] border border-red-900/30 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 shadow-xl relative overflow-hidden group">
          {/* Subtle background red light */}
          <div className="absolute inset-0 bg-red-900/5 pointer-events-none group-hover:bg-red-900/10 transition-colors" />
          
          <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
            <ShieldAlert size={20} />
          </div>

          <div className="space-y-1">
            <h4 className="text-xs font-mono font-bold tracking-wider text-red-400 uppercase">
              {this.props.fallbackTitle || 'تعطل ميزة فرعية // FEATURE FAULT DETECTED'}
            </h4>
            <p className="text-[11px] text-white/50 leading-relaxed font-sans max-w-xs">
              حدث خطأ غير متوقع أثناء معالجة هذه الواجهة. تم عزل العطل بنجاح لضمان استقرار باقي ميزات النظام.
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center space-x-1.5 px-4.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 font-mono text-[10px] uppercase font-bold rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw size={11} className="ml-1.5" />
            <span>إعادة تشغيل الميزة // RESET MODULE</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
