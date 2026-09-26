import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate';
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  color = 'blue',
  subtext,
  trend,
  onClick,
  className = '',
  loading = false,
}) => {
  const colorMap = {
    blue: {
      badge: 'bg-blue-50 text-blue-600 border-blue-100',
      accent: 'border-l-blue-600',
    },
    indigo: {
      badge: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      accent: 'border-l-indigo-600',
    },
    emerald: {
      badge: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      accent: 'border-l-emerald-600',
    },
    amber: {
      badge: 'bg-amber-50 text-amber-600 border-amber-100',
      accent: 'border-l-amber-600',
    },
    purple: {
      badge: 'bg-purple-50 text-purple-600 border-purple-100',
      accent: 'border-l-purple-600',
    },
    rose: {
      badge: 'bg-rose-50 text-rose-600 border-rose-100',
      accent: 'border-l-rose-600',
    },
    slate: {
      badge: 'bg-slate-100 text-slate-700 border-slate-200',
      accent: 'border-l-slate-600',
    },
  };

  const selectedColor = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-3 w-20 bg-slate-200 rounded"></div>
            <div className="h-8 w-28 bg-slate-200 rounded"></div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-slate-300 hover:shadow-sm' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate mb-1">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
            {value}
          </p>
          {(subtext || trend) && (
            <div className="mt-2 flex items-center gap-2 text-xs">
              {trend && (
                <span
                  className={`font-semibold flex items-center gap-0.5 ${
                    trend.isPositive !== false ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {trend.isPositive !== false ? '↑' : '↓'} {trend.value}
                </span>
              )}
              {subtext && <span className="text-slate-500 truncate">{subtext}</span>}
            </div>
          )}
        </div>
        <div
          className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center ${selectedColor.badge}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};
