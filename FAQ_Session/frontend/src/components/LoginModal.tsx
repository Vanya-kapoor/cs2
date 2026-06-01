import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockUsers } from '../utils/mockData';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, loginAs } = useAuth();

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={closeLoginModal}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={closeLoginModal}
              className="absolute top-3 right-3 p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors shadow-sm"
            >
              <X size={15} />
            </button>

            {/* Content */}
            <div className="text-center mt-3">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xl mb-4 shadow-sm">
                🔑
              </div>
              <h2 className="font-semibold text-xl leading-none font-sans text-slate-800 mb-2">
                Join <span className="text-blue-600 font-bold">Yaksha</span>
              </h2>
              <p className="text-xs text-slate-500 font-normal px-4 mb-6 leading-relaxed">
                Ask questions, post helpful answers, upvote resolutions, and build your internship reputation!
              </p>

              {/* Login Options (Simulating rapid profiles) */}
              <div className="space-y-3 relative z-10">
                <p className="text-[10px] uppercase font-semibold text-slate-400 text-left tracking-wider">
                  Select a profile to login instantly:
                </p>

                {Object.values(mockUsers).map((user) => (
                  <button
                    key={user.id}
                    onClick={() => loginAs(user.id)}
                    className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/10 transition-all duration-150 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 border border-slate-200 rounded-full text-base bg-slate-100">
                        {user.avatar}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm text-slate-800">{user.name}</p>
                        <p className="text-[9px] uppercase font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                          {user.role === 'ADMIN' && <ShieldCheck size={10} className="text-red-500" />}
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-semibold">
                        🏆 {user.stats.reputation} Rep
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Action footer */}
              <div className="mt-6 border-t border-slate-100 pt-4 text-xs font-normal text-slate-400">
                Mock active login system for frontend demonstration.
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default LoginModal;
