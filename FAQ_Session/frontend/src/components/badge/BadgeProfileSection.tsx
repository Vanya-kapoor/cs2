import React, { useEffect, useState } from 'react';
import { BadgeGrid } from './BadgeGrid';
import { BadgeCardProps } from './BadgeCard';

interface BadgeProfileSectionProps {
  userId: string;
}

export const BadgeProfileSection: React.FC<BadgeProfileSectionProps> = ({ userId }) => {
  const [badges, setBadges] = useState<BadgeCardProps[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const response = await fetch(`/api/badges/users/${userId}`);
        const data = await response.json();
        if (data.success && data.data) {
          const formattedBadges = data.data.map((b: any) => ({
            name: b.badgeId.name,
            description: b.badgeId.description,
            icon: b.badgeId.icon,
            category: b.badgeId.category,
            earnedAt: b.earnedAt,
          }));
          setBadges(formattedBadges);
        }
      } catch (error) {
        console.error('Failed to fetch badges:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchBadges();
    }
  }, [userId]);

  if (loading) {
    return <div className="animate-pulse flex space-x-4"><div className="h-24 w-full bg-gray-200 rounded"></div></div>;
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>🏆</span> Achievements & Badges
      </h3>
      <BadgeGrid badges={badges} />
    </div>
  );
};
