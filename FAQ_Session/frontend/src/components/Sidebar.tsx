import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  HelpCircle, 
  MessageSquare, 
  User, 
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { currentUser, authLoading } = useAuth();

  const menuItems = [
    { name: 'Home', path: '/', icon: Home, color: 'bg-brand-yellow' },
    { name: 'FAQs', path: '/faqs', icon: HelpCircle, color: 'bg-brand-green' },
    { name: 'Questions', path: '/questions', icon: MessageSquare, color: 'bg-brand-blue' },
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
        className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col w-[260px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 p-5 transition-transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        initial={{ x: -260 }}
        animate={{ x: 0 }}
        transition={{ type: 'tween', duration: 0.2 }}
      >
        {/* App Branding */}
        <div className="flex items-center gap-3 py-3 mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 text-xl font-bold">
            🚀
          </div>
          <div>
            <h1 className="font-semibold text-lg tracking-tight leading-none flex items-center gap-1 font-sans text-slate-900 dark:text-slate-100">
              Yaksha
            </h1>
            <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400 leading-none mt-1">
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
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 font-sans text-sm">{item.name}</span>
            </NavLink>
          ))}

          {/* Admin Panel (Role Based) */}
          {!authLoading && currentUser && currentUser.role === 'ADMIN' && (
            <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700">
              <NavLink
                to={adminItem.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2 text-sm font-medium transition-colors duration-150 rounded-lg ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <adminItem.icon className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                <span className="flex-1 font-sans text-sm">{adminItem.name}</span>
                <span className="px-1.5 py-0.5 text-[9px] font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md">
                  Admin
                </span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Footer card */}
        <div className="mt-auto pt-4">
          <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm flex flex-col items-center text-center">
            <span className="text-2xl mb-1.5">💡</span>
            <h4 className="font-medium text-sm mb-1 text-slate-900 dark:text-slate-100 leading-tight">Got a query?</h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">Answers are just one question away!</p>
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
