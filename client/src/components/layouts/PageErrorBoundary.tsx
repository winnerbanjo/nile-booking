import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  user?: any;
  location?: any;
}

interface State {
  hasError: boolean;
  errorId: string;
  retryCount: number;
}

export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorId: '', retryCount: 0 };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true, errorId: Math.random().toString(36).substring(2, 9).toUpperCase() };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const deploymentVersion = import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA || 'unknown';
    
    // Log to console
    console.error(`[PageCrash-${this.state.errorId}] Unhandled Runtime Error:`);
    console.error(`Message: ${error.message}`);
    console.error(`Stack: ${error.stack}`);

    // Fire and forget to backend
    fetch('/api/system/frontend-errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceId: this.state.errorId,
        message: error.message,
        stack: error.stack ? error.stack.substring(0, 1000) : '',
        componentStack: errorInfo.componentStack ? errorInfo.componentStack.substring(0, 1000) : '',
        route: window.location.pathname + window.location.search,
        userId: this.props.user?._id,
        userRole: this.props.user?.role,
        deploymentVersion,
        browser: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    }).catch(() => { /* Ignore failure */ });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[300px] w-full">
          <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
          <h3 className="text-base font-bold text-red-900 mb-1">Failed to load content</h3>
          <p className="text-sm text-red-600 max-w-sm mx-auto mb-2">
            {this.props.fallbackMessage || "We encountered an unexpected error while rendering this page."}
          </p>
          <div className="mb-6 px-3 py-1.5 bg-red-100/50 rounded text-xs font-mono text-red-800 border border-red-200">
            Error Ref: {this.state.errorId}
          </div>
          <button
            onClick={() => {
              if (this.state.retryCount > 1) {
                window.location.reload();
              } else {
                this.setState(prev => ({ hasError: false, errorId: '', retryCount: prev.retryCount + 1 }));
              }
            }}
            className="px-6 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
