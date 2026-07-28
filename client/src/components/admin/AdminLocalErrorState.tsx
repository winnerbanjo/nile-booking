import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AdminLocalErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const AdminLocalErrorState: React.FC<AdminLocalErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'The request failed. Please try again.',
  onRetry,
}) => {
  return (
    <div className="w-full bg-red-50/50 border border-red-100 rounded-xl p-10 flex flex-col items-center justify-center text-center min-h-[240px]">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500" />
      </div>
      <h3 className="text-base font-bold text-red-900 mb-1">{title}</h3>
      <p className="text-sm text-red-600 max-w-sm mx-auto mb-5">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-5 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-sm font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Try Again
        </button>
      )}
    </div>
  );
};
