import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  /** Optional custom fallback UI */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * Global error boundary — catches any unhandled React render errors and
 * shows a clean, user-friendly error page instead of a blank screen or
 * raw stack trace.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    // Never expose the raw stack trace to users
    const message =
      error?.message && error.message.length < 200
        ? error.message
        : 'An unexpected error occurred.';
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log to console in development only — never show to the user
    if (import.meta.env.MODE === 'development') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-red-400 via-rose-500 to-pink-500" />
            <div className="p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 bg-red-50 border border-red-100 rounded-full mx-auto mb-5">
                <AlertTriangle size={30} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Something went wrong</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {this.state.errorMessage}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={this.handleReset}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <RefreshCw size={15} />
                  Try Again
                </button>
                <button
                  onClick={() => {
                    this.handleReset();
                    window.location.href = '/';
                  }}
                  className="w-full py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Home size={15} />
                  Go to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
