import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  HelpCircle, 
  MessageSquare, 
  TrendingUp, 
  Bookmark, 
  User, 
  Bell, 
  ShieldAlert, 
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMockDb } from '../context/MockDbContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentUser } = useAuth();
  const { notifications } = useMockDb();
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const menuItems = [
    { name: 'Home', path: '/', icon: Home, color: 'bg-brand-yellow' },
    { name: 'FAQs', path: '/faqs', icon: HelpCircle, color: 'bg-brand-green' },
    { name: 'Questions', path: '/questions', icon: MessageSquare, color: 'bg-brand-blue' },
    { name: 'Trending', path: '/trending', icon: TrendingUp, color: 'bg-brand-pink' },
    { name: 'Categories', path: '/categories', icon: Layers, color: 'bg-brand-purple' },
    { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark, color: 'bg-brand-orange' },
    { name: 'My Questions', path: '/my-questions', icon: BookOpen, color: 'bg-brand-yellow' },
    { 
      name: 'Notifications', 
      path: '/notifications', 
      icon: Bell, 
      color: 'bg-brand-pink',
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : undefined 
    },
    { name: 'Profile', path: '/profile', icon: User, color: 'bg-brand-green' },
  ];

  const adminItem = { name: 'Admin Panel', path: '/admin', icon: ShieldAlert, color: 'bg-red-400' };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <motion.aside
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col w-[260px] bg-slate-50 border-r border-slate-200 p-5 transition-transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ type: 'tween', duration: 0.2 }}
      >
        {/* App Branding */}
        <div className="flex items-center gap-3 py-3 mb-6 bg-white border border-slate-200 rounded-xl p-3 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 text-blue-600 text-xl font-bold">
            🚀
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight leading-none flex items-center gap-1 font-sans text-slate-900">
              Yaksha
            </h1>
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500 leading-none mt-1">
              FAQ & KNOWLEDGE
            </p>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2 text-sm font-medium transition-colors duration-150 rounded-lg ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 font-sans text-sm">{item.name}</span>
              {item.badge !== undefined && (
                <span className="flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-semibold bg-blue-600 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          {/* Admin Panel (Role Based) */}
          {currentUser && currentUser.role === 'ADMIN' && (
            <div className="pt-3 mt-3 border-t border-slate-200">
              <NavLink
                to={adminItem.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 text-sm font-medium transition-colors duration-150 rounded-lg ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <adminItem.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="flex-1 font-sans text-sm">{adminItem.name}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-medium bg-red-100 text-red-700 rounded-md">
                  Admin
                </span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer Decorative card */}
        <div className="mt-auto pt-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center text-center">
            <span className="text-2xl mb-1.5">💡</span>
            <h4 className="font-medium text-sm mb-1 text-slate-900 leading-tight">Got a query?</h4>
            <p className="text-[11px] text-slate-500 mb-3">Answers are just one question away!</p>
            <NavLink
              to="/ask"
              onClick={() => setIsOpen(false)}
              className="w-full text-center py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
            >
              Ask Now
            </NavLink>
          </div>
        </div>
      </motion.aside>
    </>
  );
};
export default Sidebar;
