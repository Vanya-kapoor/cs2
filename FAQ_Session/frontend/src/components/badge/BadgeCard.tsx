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
    <div className="flex flex-col items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-100">
      <div className="text-4xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-800 text-center text-sm">{name}</h4>
      <p className="text-xs text-gray-500 text-center mt-1">{description}</p>
      <div className="mt-3 flex justify-between w-full text-[10px] text-gray-400">
        <span className="uppercase tracking-wider">{category}</span>
        {earnedAt && <span>{new Date(earnedAt).toLocaleDateString()}</span>}
      </div>
    </div>
  );
};
