import React, { useState } from 'react';
import { Menu, LogIn, LogOut, ChevronDown, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../utils/mockData';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { currentUser, isAuthenticated, logout, openLoginModal, loginAs } = useAuth();
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full h-[72px] bg-white border-b border-slate-200 px-6">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 border border-slate-200 rounded-lg bg-white text-slate-600 hover:bg-slate-50 transition-colors md:hidden shadow-sm animate-none"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xl"></span>
          <span className="font-semibold text-sm text-slate-500 font-sans">
            Yaksha FAQ Platform
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Role Switcher Demo Widget */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 shadow-sm transition-colors text-xs font-medium"
          >
            <span>Switch Role</span>
            <ChevronDown size={14} />
          </button>
          
          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-2 space-y-1">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 px-2 py-1">
                Select Test User Profile:
              </p>
              {Object.values(mockUsers).map((u) => (
                <button
                  key={u.id}
                  onClick={() => {
                    loginAs(u.id);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors ${
                    currentUser?.id === u.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600'
                  }`}
                >
                  <span className="text-lg">{u.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium">{u.name}</p>
                    <p className="text-[9px] text-slate-400 uppercase leading-none font-semibold flex items-center gap-1">
                      {u.role === 'ADMIN' && <ShieldCheck size={10} className="text-red-500" />}
                      {u.role}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Card */}
        {isAuthenticated && currentUser ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="font-medium text-sm text-slate-800 leading-none">{currentUser.name}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded leading-none uppercase font-semibold">
                  {currentUser.role}
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  🏆 {currentUser.stats.reputation} Rep
                </span>
              </div>
            </div>
            
            {/* SaaS Avatar */}
            <div className="flex items-center justify-center w-9 h-9 border border-slate-200 rounded-full bg-slate-100 text-lg shadow-sm">
              {currentUser.avatar}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
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
