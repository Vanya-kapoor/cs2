import React from 'react';
import { ShieldCheck, Award, AlertTriangle, CheckCircle } from 'lucide-react';

// ==========================================
// 1. CategoryChip
// ==========================================
interface CategoryChipProps {
  category: string;
  onClick?: () => void;
  active?: boolean;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({ category, onClick, active = false }) => {
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'stipend': return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'ppo': return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      case 'eligibility': return 'bg-sky-50 text-sky-700 border-sky-200/50';
      case 'interview process': return 'bg-pink-50 text-pink-700 border-pink-200/50';
      case 'projects': return 'bg-violet-50 text-violet-700 border-violet-200/50';
      case 'joining formalities': return 'bg-orange-50 text-orange-700 border-orange-200/50';
      case 'company policies': return 'bg-slate-50 text-slate-700 border-slate-200/50';
      case 'technical issues': return 'bg-rose-50 text-rose-700 border-rose-200/50';
      default: return 'bg-slate-50 text-slate-600 border-slate-200/50';
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`px-2.5 py-0.5 rounded-full border text-xs font-medium transition-all ${
        onClick ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-900' : ''
      } ${active ? 'bg-blue-600 border-blue-600 text-white shadow-none' : getCategoryColor(category)}`}
    >
      #{category}
    </button>
  );
};

// ==========================================
// 2. StatusBadge
// ==========================================
interface StatusBadgeProps {
  status: 'OPEN' | 'ANSWERED' | 'ESCALATED' | 'UNDER_REVIEW' | 'RESOLVED';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (stat: string) => {
    switch (stat) {
      case 'OPEN':
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Open' };
      case 'ANSWERED':
        return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Answered' };
      case 'ESCALATED':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Escalated' };
      case 'UNDER_REVIEW':
        return { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Under Review' };
      case 'RESOLVED':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Resolved' };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: stat };
    }
  };

  const style = getStatusStyles(status);

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold border rounded-full ${style.bg}`}>
      {status === 'ESCALATED' && <AlertTriangle size={11} />}
      {status === 'RESOLVED' && <CheckCircle size={11} />}
      {style.label}
    </span>
  );
};

// ==========================================
// 3. OfficialBadge
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
// 4. StatsCard
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
// 5. EmptyState
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
