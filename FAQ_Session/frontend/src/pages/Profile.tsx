import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { EmptyState, Skeleton } from '../components/CommonWidgets';
import { BadgeProfileSection } from '../components/badge/BadgeProfileSection';

export const Profile: React.FC = () => {
  const { currentUser, authLoading, openLoginModal } = useAuth();
  const { questions } = useAppContext();

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 w-full space-y-3">
            <Skeleton className="h-7 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <EmptyState
          title="Sign in to view Profile"
          description="Access your personal stats, reputation level, and earned achievements."
        />
        <button
          onClick={openLoginModal}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          Login Instantly 🔓
        </button>
      </div>
    );
  }

  // Compute stats from live backend data
  const myQuestions = questions.filter(q => q.author.id === currentUser.id && !q.isOfficial);
  const myAnswers = questions.flatMap(q => q.answers).filter(a => a.author.id === currentUser.id);
  const reputation = myQuestions.length * 10 + myAnswers.length * 15;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="max-w-3xl mx-auto space-y-8"
    >
      {/* Profile Card Header */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm flex flex-col md:flex-row items-center gap-6 text-center md:text-left relative overflow-hidden">
        {/* Large Avatar */}
        <div className="w-24 h-24 border border-slate-200 rounded-full bg-slate-50 flex items-center justify-center text-5xl shadow-sm relative overflow-hidden">
          {currentUser.avatar?.startsWith('http') ? (
            <img src={currentUser.avatar} alt={currentUser.name} referrerPolicy="no-referrer"
              className="w-full h-full object-cover" />
          ) : (
            currentUser.avatar
          )}
          <span className="absolute bottom-0 right-0 px-2 py-0.5 bg-slate-900 border border-white text-[9px] text-white font-semibold rounded uppercase">
            {currentUser.role}
          </span>
        </div>

        {/* Details info */}
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 font-sans leading-none">
            {currentUser.name}
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
            {currentUser.role} · Platform Member
          </p>

          {/* Reputation bar */}
          <div className="pt-2 max-w-sm">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Reputation Level</span>
              <span>{reputation} Rep</span>
            </div>
            <div className="w-full h-3 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${Math.min((reputation / 500) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3 select-none text-slate-600">
          <HelpCircle size={22} className="text-slate-400" />
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Questions Asked</p>
            <p className="text-2xl font-semibold text-slate-800 leading-none mt-1.5 font-sans">{myQuestions.length}</p>
          </div>
        </div>

        <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3 select-none text-slate-600">
          <MessageSquare size={22} className="text-slate-400" />
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Answers Posted</p>
            <p className="text-2xl font-semibold text-slate-800 leading-none mt-1.5 font-sans">{myAnswers.length}</p>
          </div>
        </div>
      </div>

      {/* Badge Showcase from backend */}
      <BadgeProfileSection userId={currentUser.id} />
    </motion.div>
  );
};
export default Profile;
