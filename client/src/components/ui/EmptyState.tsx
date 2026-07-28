import React from 'react';
import { Button } from './button';
import { RefreshCcw, Search, Filter, AlertCircle, FileX } from 'lucide-react';
import { motion } from 'framer-motion';

export type EmptyStateType = 'empty' | 'search' | 'filter' | 'error' | 'permission';

interface EmptyStateProps {
  type?: EmptyStateType;
  title: string;
  description: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'empty',
  title,
  description,
  primaryAction,
  secondaryAction,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'search':
        return <Search className="w-12 h-12 text-zinc-300" />;
      case 'filter':
        return <Filter className="w-12 h-12 text-zinc-300" />;
      case 'error':
        return <AlertCircle className="w-12 h-12 text-red-300" />;
      case 'permission':
        return <AlertCircle className="w-12 h-12 text-orange-300" />;
      case 'empty':
      default:
        return <FileX className="w-12 h-12 text-zinc-300" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-xl border border-zinc-100 shadow-sm h-full w-full min-h-[300px]"
    >
      <div className="bg-zinc-50 p-4 rounded-full mb-6">
        {getIcon()}
      </div>
      <h3 className="text-xl font-semibold text-zinc-900 mb-2">{title}</h3>
      <p className="text-zinc-500 max-w-md mb-8">{description}</p>
      
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="min-w-[140px]" variant={type === 'error' ? 'outline' : 'default'}>
              {primaryAction.icon || (type === 'error' && <RefreshCcw className="w-4 h-4 mr-2" />)}
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" className="min-w-[140px]">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};
