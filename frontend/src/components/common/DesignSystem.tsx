import React from 'react';

interface PageHeaderProps {
  category: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  rightContent?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  category,
  title,
  description,
  icon,
  badge = 'Decision Support Only',
  rightContent,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
            {icon}
            <span>{category}</span>
          </span>
          {badge && (
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-semibold">
              {badge}
            </span>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
          {title}
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
          {description}
        </p>
      </div>

      {rightContent && <div className="shrink-0">{rightContent}</div>}
    </div>
  );
};

interface ContentCardProps {
  children: React.ReactNode;
  className?: string;
}

export const ContentCard: React.FC<ContentCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs ${className}`}>
      {children}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  bg?: string;
  border?: string;
  onClick?: () => void;
  isActive?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sub,
  icon: Icon,
  color = 'text-indigo-600',
  bg = 'bg-indigo-50',
  border = 'border-indigo-100',
  onClick,
  isActive,
}) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-3 flex flex-col justify-between transition border shadow-2xs ${
        onClick ? 'cursor-pointer hover:bg-slate-100/70' : ''
      } ${
        isActive
          ? 'bg-indigo-50/90 border-indigo-300 ring-2 ring-indigo-200'
          : 'bg-slate-50/80 border-slate-200/70'
      }`}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className={`p-1.5 rounded-lg ${bg} ${border} border shrink-0`}>
            <Icon className={`w-3.5 h-3.5 ${color}`} />
          </div>
        )}
        <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight font-mono ml-auto">
          {value}
        </span>
      </div>
      <div className="mt-1.5 min-w-0">
        <span className="text-[10.5px] font-bold text-slate-800 block leading-snug">
          {label}
        </span>
        {sub && (
          <span className="text-[9px] text-slate-500 font-mono block leading-tight mt-0.5">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
};
