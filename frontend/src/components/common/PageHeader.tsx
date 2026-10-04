import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = '',
}) => {
  return (
    <div className={`bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm space-y-3 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          {eyebrow && (
            <span className="text-[10px] font-bold text-[#1D4ED8] uppercase tracking-wider block">
              {eyebrow}
            </span>
          )}
          <h1 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="text-xs text-slate-600">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start sm:self-center">
            {actions}
          </div>
        )}
      </div>

      {children && (
        <div className="pt-2 border-t border-[#E5F5E0]">
          {children}
        </div>
      )}
    </div>
  );
};
