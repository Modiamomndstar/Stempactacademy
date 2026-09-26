import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  count?: number | string;
  badge?: string;
  disabled?: boolean;
}

export interface ContextualTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const ContextualTabs: React.FC<ContextualTabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div
      className={`flex items-center gap-1 border-b border-slate-200 overflow-x-auto no-scrollbar select-none ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={`group relative flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all duration-150 border-b-2 -mb-px outline-none ${
              isActive
                ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-lg font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
            } ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {Icon && (
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}
              >
                {tab.count}
              </span>
            )}
            {tab.badge && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded uppercase">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
