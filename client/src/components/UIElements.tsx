import React from 'react';

export const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}> = ({ children, variant = 'blue', size = 'sm', className = '' }) => {
  const variantStyles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    red: 'bg-rose-50 text-rose-700 border-rose-200/60',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/60',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-semibold',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};

export const Card: React.FC<{
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}> = ({ children, className = '', hoverable = false }) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${
        hoverable ? 'transition-all duration-200 hover:shadow-md hover:border-blue-300 transform hover:-translate-y-0.5' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading STEMPACT data...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <div className="relative w-12 h-12">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-rose-500 animate-pulse"></div>
        </div>
      </div>
      <p className="text-xs font-medium text-slate-500 animate-pulse">{message}</p>
    </div>
  );
};
