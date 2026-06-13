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
    <div className="flex flex-col items-center p-4 bg-white dark:bg-slate-700 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-600">
      <div className="text-4xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-800 dark:text-slate-100 text-center text-sm">{name}</h4>
      <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-1">{description}</p>
      <div className="mt-3 flex justify-between w-full text-[10px] text-gray-400 dark:text-slate-500">
        <span className="uppercase tracking-wider">{category}</span>
        {earnedAt && <span>{new Date(earnedAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
};
