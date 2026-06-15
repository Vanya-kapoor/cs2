import React from 'react';
import { ShieldCheck, Award, CheckCircle } from 'lucide-react';

// ==========================================
// 0. Skeleton primitives
// ==========================================
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200/70 dark:bg-slate-700/70 rounded-md animate-pulse ${className}`} />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm space-y-3 ${className}`}>
    <Skeleton className="h-3 w-1/3" />
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-5/6" />
  </div>
);

export const SkeletonRow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse ${className}`} />
);

export const SkeletonStatsCard: React.FC = () => (
  <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex items-center justify-between">
    <div className="space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-12" />
    </div>
    <Skeleton className="w-11 h-11 rounded-full" />
  </div>
);

// ==========================================
// 1. StatusBadge
// ==========================================
interface StatusBadgeProps {
  status: 'OPEN' | 'ANSWERED' | 'RESOLVED';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (stat: string) => {
    switch (stat) {
      case 'OPEN':
        return { bg: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', label: 'Open' };
      case 'ANSWERED':
        return { bg: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', label: 'Answered' };
      case 'RESOLVED':
        return { bg: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800', label: 'Resolved' };
      default:
        return { bg: 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600', label: stat };
    }
  };

  const style = getStatusStyles(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold border rounded-full ${style.bg}`}>
      {status === 'RESOLVED' && <CheckCircle size={11} />}
      {style.label}
    </span>
  );
};

// ==========================================
// 2. OfficialBadge
// ==========================================
interface OfficialBadgeProps {
  type: 'official' | 'accepted';
}

export const OfficialBadge: React.FC<OfficialBadgeProps> = ({ type }) => {
  if (type === 'official') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full">
        <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400 fill-blue-100 dark:fill-blue-900/30" />
        <span>Official Verified</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full">
      <Award size={12} className="text-emerald-600 dark:text-emerald-400 fill-emerald-100 dark:fill-emerald-900/30" />
      <span>Accepted Solution</span>
    </span>
  );
};

// ==========================================
// 3. StatsCard
// ==========================================
interface StatsCardProps {
  title: string;
  value: number | string;
  color: string;
  icon: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, color, icon }) => {
  return (
    <div className="p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 select-none">
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">{title}</p>
        <p className="text-2xl font-semibold text-slate-900 dark:text-slate-100 leading-none font-sans">{value}</p>
      </div>
      <div className="flex items-center justify-center w-11 h-11 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-full text-xl">
        {icon}
      </div>
    </div>
  );
};

// ==========================================
// 4. EmptyState
// ==========================================
interface EmptyStateProps {
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, description }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12 px-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-center max-w-lg mx-auto my-6">
      <div className="text-4xl mb-3">🔍</div>
      <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 mb-1.5 font-sans">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-normal max-w-xs leading-relaxed">{description}</p>
    </div>
  );
};
