import { Component } from 'react';
import type { ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../../types/shared';

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo, error });
  }

  private handleReset = () => {
    const { onReset, inline } = this.props;
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (onReset) {
      onReset();
    } else if (!inline) {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const { fallback, fallbackTitle, fallbackDescription, inline } = this.props;
      const error = this.state.error || new Error('Unknown error');

      if (typeof fallback === 'function') {
        return fallback(error, this.handleReset);
      }
      if (fallback) {
        return fallback;
      }

      const title = fallbackTitle || 'Application Error';
      const description =
        fallbackDescription ||
        'An unexpected error occurred during rendering. This is likely caused by missing properties or data mismatch.';

      if (inline) {
        return (
          <div className="w-full h-full min-h-[160px] flex items-center justify-center p-4 bg-canvas font-['JetBrains_Mono',monospace]">
            <div className="bg-white border-2 border-ink rounded-2xl p-6 max-w-md w-full shadow-brutal space-y-4">
              <div className="flex items-center gap-3 border-b-2 border-ink/10 pb-3">
                <span className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center border-2 border-ink shrink-0">
                  <AlertTriangle size={18} />
                </span>
                <div>
                  <h3 className="font-['Anybody',sans-serif] font-black text-xs text-ink uppercase tracking-wide">
                    {title}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Component Isolated</span>
                </div>
              </div>

              <p className="text-xs text-ink/80 font-semibold leading-relaxed">
                {description}
              </p>

              {this.state.error && (
                <div className="bg-slate-100 border border-ink/20 rounded-lg p-2.5 text-[11px] font-mono text-rose-600 break-all select-all">
                  {this.state.error.message || this.state.error.toString()}
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex items-center gap-1.5 px-4 py-2 bg-ink text-canvas hover:bg-white hover:text-ink border-2 border-ink text-xs font-bold rounded-xl transition-all shadow-brutal-sm cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-lg w-full shadow-lg space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <span className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shrink-0">
                <AlertTriangle size={20} />
              </span>
              <div>
                <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">{title}</h2>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Rendering Crash</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                {description}
              </p>
              {this.state.error && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-rose-600 break-all select-all leading-relaxed">
                  <p className="font-bold mb-1">{this.state.error.toString()}</p>
                  {this.state.errorInfo && (
                    <pre className="text-[10px] text-slate-400 mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow shadow-indigo-100 cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
