import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin component failed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50/50 border border-red-100 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[200px]">
          <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
          <h3 className="text-sm font-bold text-red-900 mb-1">Failed to load content</h3>
          <p className="text-xs text-red-600 max-w-xs mx-auto mb-4">
            {this.props.fallbackMessage || "We couldn't load this section of the dashboard right now."}
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
