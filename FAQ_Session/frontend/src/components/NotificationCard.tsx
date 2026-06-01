import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, MessageSquare, AlertTriangle, ShieldCheck, Check } from 'lucide-react';
import { Notification } from '../types';
import { useMockDb } from '../context/MockDbContext';

interface NotificationCardProps {
  notification: Notification;
  index: number;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({ notification, index }) => {
  const navigate = useNavigate();
  const { markNotificationRead } = useMockDb();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'ANSWER_RECEIVED':
        return { icon: MessageSquare, color: 'bg-blue-50 text-blue-600 border-blue-100' };
      case 'ANSWER_ACCEPTED':
        return { icon: Check, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'ESCALATED':
        return { icon: AlertTriangle, color: 'bg-amber-50 text-amber-600 border-amber-100' };
      case 'OFFICIAL_ANSWER':
        return { icon: ShieldCheck, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' };
      default:
        return { icon: Bell, color: 'bg-purple-50 text-purple-600 border-purple-100' };
    }
  };

  const { icon: IconComponent, color } = getNotificationIcon(notification.type);

  const handleClick = () => {
    markNotificationRead(notification.id);
    navigate(`/questions/${notification.questionId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      onClick={handleClick}
      className={`p-4 border rounded-xl cursor-pointer transition-all flex gap-3 items-start ${
        notification.read
          ? 'bg-white opacity-85 border-slate-100 hover:bg-slate-50/50'
          : 'bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
      }`}
    >
      {/* Icon */}
      <div className={`p-2 rounded-lg border ${color} flex-shrink-0 flex items-center justify-center`}>
        <IconComponent size={15} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-semibold text-sm text-slate-800 leading-none">
            {notification.title}
          </h4>
          <span className="text-[10px] text-slate-400 font-medium">
            {new Date(notification.createdAt).toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
        <p className="text-xs font-normal text-slate-500 mt-1 leading-normal">
          {notification.content}
        </p>
      </div>

      {/* Unread marker */}
      {!notification.read && (
        <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1.5" />
      )}
    </motion.div>
  );
};
export default NotificationCard;
