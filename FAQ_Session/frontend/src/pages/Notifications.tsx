import React from 'react';
import { motion } from 'framer-motion';
import { Bell } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import { NotificationCard } from '../components/NotificationCard';
import { EmptyState } from '../components/CommonWidgets';

export const Notifications: React.FC = () => {
  const { notifications, markAllNotificationsRead } = useMockDb();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-2">
            <span>Alerts Feed</span>
            <Bell className="text-blue-500" size={22} />
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
            Track replies, accepted solution credits, and escalated questions
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsRead}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors self-start sm:self-auto cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((notification, idx) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              index={idx}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="All clear! No alerts"
          description="You will receive alerts here whenever someone answers your questions, verifies solutions, or escalates unresolved tickets."
        />
      )}
    </motion.div>
  );
};
export default Notifications;
