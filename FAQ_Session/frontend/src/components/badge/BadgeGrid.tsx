import React from 'react';
import { BadgeCard, BadgeCardProps } from './BadgeCard';

interface BadgeGridProps {
  badges: BadgeCardProps[];
}

export const BadgeGrid: React.FC<BadgeGridProps> = ({ badges }) => {
  if (!badges || badges.length === 0) {
    return <p className="text-gray-500 text-sm">No badges earned yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {badges.map((badge, index) => (
        <BadgeCard key={index} {...badge} />
      ))}
    </div>
  );
};
