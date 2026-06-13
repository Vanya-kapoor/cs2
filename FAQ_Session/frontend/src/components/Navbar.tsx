import React from 'react';
import { Menu, LogIn, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Skeleton } from './CommonWidgets';
import { NotificationPanel } from './NotificationPanel';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { currentUser, isAuthenticated, authLoading, logout, openLoginModal } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-[72px] bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 transition-colors">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors md:hidden shadow-sm"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xl">🎓</span>
          <span className="font-semibold text-sm text-slate-500 dark:text-slate-400 font-sans">
            Yaksha FAQ Platform
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {authLoading ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
        ) : isAuthenticated && currentUser ? (
          <div className="flex items-center gap-3">
            <NotificationPanel />
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-medium text-sm text-slate-800 dark:text-slate-100 leading-none">{currentUser.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded leading-none uppercase font-semibold">
                  {currentUser.role}
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  🏆 {currentUser.stats.reputation} Rep
                </span>
              </div>
            </div>

            {currentUser.avatar?.startsWith('http') ? (
              <img src={currentUser.avatar} alt={currentUser.name} referrerPolicy="no-referrer"
               className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-600 shadow-sm" />
               ) : (
               <div className="flex items-center justify-center w-9 h-9 border border-slate-200 dark:border-slate-600 rounded-full bg-slate-100 dark:bg-slate-700 text-lg shadow-sm">
                {currentUser.avatar}
               </div>
             )}

            <button
              onClick={logout}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={openLoginModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors text-sm font-medium"
          >
            <LogIn size={16} />
            <span>Login / Join</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
