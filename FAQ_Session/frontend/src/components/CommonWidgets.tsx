import React from 'react';
import { ShieldCheck, Award, CheckCircle } from 'lucide-react';

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
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Open' };
      case 'ANSWERED':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Answered' };
      case 'RESOLVED':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Resolved' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: stat };
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
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
        <ShieldCheck size={12} className="text-blue-600 fill-blue-100" />
        <span>Official Verified</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
      <Award size={12} className="text-emerald-600 fill-emerald-100" />
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
    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md hover:border-slate-300 select-none">
      <div>
        <p className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-1.5">{title}</p>
        <p className="text-2xl font-semibold text-slate-900 leading-none font-sans">{value}</p>
      </div>
      <div className="flex items-center justify-center w-11 h-11 bg-slate-50 border border-slate-100 rounded-full text-xl">
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
    <div className="w-full flex flex-col items-center justify-center py-12 px-6 border border-slate-200 bg-white rounded-xl shadow-sm text-center max-w-lg mx-auto my-6">
      <div className="text-4xl mb-3">🔍</div>
      <h3 className="font-semibold text-base text-slate-800 mb-1.5 font-sans">{title}</h3>
      <p className="text-xs text-slate-500 font-normal max-w-xs leading-relaxed">{description}</p>
    </div>
  );
};
