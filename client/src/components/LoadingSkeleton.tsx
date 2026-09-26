import React from 'react';

export interface LoadingSkeletonProps {
  variant?: 'cards' | 'table' | 'text' | 'detail';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'cards',
  count = 3,
  className = '',
}) => {
  if (variant === 'cards') {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-slate-200 rounded"></div>
                <div className="h-8 w-28 bg-slate-200 rounded"></div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-slate-100"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-xs animate-pulse ${className}`}>
        <div className="h-11 bg-slate-100/80 border-b border-slate-200"></div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-3.5 w-44 bg-slate-200 rounded"></div>
                  <div className="h-2.5 w-28 bg-slate-100 rounded"></div>
                </div>
              </div>
              <div className="h-5 w-20 bg-slate-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'detail') {
    return (
      <div className={`bg-white rounded-xl border border-slate-200/90 p-6 space-y-6 shadow-xs animate-pulse ${className}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-200"></div>
          <div className="space-y-2 flex-1">
            <div className="h-5 w-48 bg-slate-200 rounded"></div>
            <div className="h-3 w-32 bg-slate-100 rounded"></div>
          </div>
        </div>
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="h-3.5 w-full bg-slate-100 rounded"></div>
          <div className="h-3.5 w-5/6 bg-slate-100 rounded"></div>
          <div className="h-3.5 w-4/6 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Fallback text skeleton
  return (
    <div className={`space-y-2.5 animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="h-3.5 bg-slate-200 rounded w-full"></div>
      ))}
    </div>
  );
};
