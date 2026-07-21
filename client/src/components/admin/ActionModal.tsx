import React from 'react';
import { X } from 'lucide-react';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: Record<string, string | number>;
  actions: {
    label: string;
    onClick: () => void;
    variant: 'danger' | 'secondary' | 'primary';
  }[];
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  title,
  data,
  actions,
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-sm p-4"
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            Record Details
          </h4>
          <div className="space-y-3 mb-8">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-medium text-gray-500">{key}</span>
                <span className="text-sm font-bold text-gray-900 text-right">{value}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  action.onClick();
                  onClose();
                }}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-colors ${
                  action.variant === 'danger'
                    ? 'bg-red-50 text-red-600 hover:bg-red-100'
                    : action.variant === 'primary'
                    ? 'bg-zinc-950 text-white hover:bg-zinc-800'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
