import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { apiService } from '../utils/api';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const resolveLink = (notification: Notification): string | null => {
  if (notification.type === 'BADGE') return '/profile';
  if (notification.type === 'APPROVAL') return notification.link || null;
  if (notification.type === 'FAQ') return notification.link || null;
  return null;
};

export const NotificationPanel: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { socket } = useSocket();
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiService.getNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleNew = (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
    };
    socket.on('new_notification', handleNew);
    return () => { socket.off('new_notification', handleNew); };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await apiService.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    await apiService.markAllNotificationsAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await apiService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n._id !== id));
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    await apiService.deleteAllNotifications();
    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) handleMarkAsRead(notification._id);
    const link = resolveLink(notification);
    if (link) {
      navigate(link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/80">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">Notifications</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={unreadCount === 0}
                  title="Mark all as read"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
                <span className="text-slate-200 dark:text-slate-600">|</span>
                <button
                  onClick={handleClearAll}
                  disabled={notifications.length === 0}
                  title="Clear all notifications"
                  className="text-xs text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  <Trash2 className="w-3 h-3" /> Clear all
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                  No notifications yet.
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification._id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`group p-3 border-b border-slate-50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex items-start gap-2 ${!notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className={`text-sm font-medium ${!notification.isRead ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0 ml-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 line-clamp-2">{notification.message}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {/* Per-item dismiss button */}
                    <button
                      onClick={(e) => handleDelete(notification._id, e)}
                      title="Dismiss"
                      className="flex-shrink-0 mt-0.5 p-1 text-slate-300 dark:text-slate-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
