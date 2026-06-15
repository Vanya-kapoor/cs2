import React from 'react';

export interface BadgeCardProps {
  name: string;
  description: string;
  icon: string;
  category: string;
  earnedAt?: string;
}

export const BadgeCard: React.FC<BadgeCardProps> = ({ name, description, icon, category, earnedAt }) => {
  return (
    <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-700 rounded-lg shadow hover:shadow-md transition-shadow border border-slate-100 dark:border-slate-600">
      <div className="text-4xl mb-2">{icon}</div>
      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-center text-sm">{name}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">{description}</p>
      <div className="mt-3 flex flex-col items-start gap-1.5 w-full">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
          {category}
        </span>
        {earnedAt && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {new Date(earnedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
};
