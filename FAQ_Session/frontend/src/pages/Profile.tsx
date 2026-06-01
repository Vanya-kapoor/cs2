import React from 'react';
import { motion } from 'framer-motion';
import { Award, MessageSquare, ThumbsUp, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMockDb } from '../context/MockDbContext';
import { EmptyState } from '../components/CommonWidgets';

export const Profile: React.FC = () => {
  const { currentUser, openLoginModal } = useAuth();
  const { questions } = useMockDb();

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

  // Define badge metadata
  const badgeDetails = [
    {
      name: 'First Question',
      desc: 'Asked the very first onboarding query on InternHub',
      icon: '🐣',
      color: 'bg-white',
      req: currentUser.stats.questionsAsked >= 1
    },
    {
      name: 'Helpful Contributor',
      desc: 'Shared a helpful solution accepted by another intern',
      icon: '🤝',
      color: 'bg-white',
      req: currentUser.stats.answersPosted >= 1
    },
    {
      name: 'Top Intern',
      desc: 'Accumulated over 100 Reputation points on the platform',
      icon: '🚀',
      color: 'bg-white',
      req: currentUser.stats.reputation >= 100
    },
    {
      name: 'FAQ Expert',
      desc: 'Had an answered question officially converted to a Verified FAQ entry',
      icon: '🎓',
      color: 'bg-white',
      req: currentUser.role === 'ADMIN' || questions.some(q => q.author.id === currentUser.id && q.isOfficial)
    }
  ];

  const earnedBadges = badgeDetails.filter(b => b.req);

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
        <div className="w-24 h-24 border border-slate-200 rounded-full bg-slate-50 flex items-center justify-center text-5xl shadow-sm relative">
          {currentUser.avatar}
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
            Platform Member since May 2026
          </p>

          {/* Reputation bar */}
          <div className="pt-2 max-w-sm">
            <div className="flex justify-between text-xs font-semibold text-slate-500 mb-1.5">
              <span>Reputation Level</span>
              <span>{currentUser.stats.reputation} / 1000 Rep</span>
            </div>
            <div className="w-full h-3 bg-slate-100 border border-slate-200/50 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${Math.min((currentUser.stats.reputation / 1000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3 select-none text-slate-600">
          <HelpCircle size={22} className="text-slate-400" />
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Questions Asked</p>
            <p className="text-2xl font-semibold text-slate-800 leading-none mt-1.5 font-sans">{currentUser.stats.questionsAsked}</p>
          </div>
        </div>
        
        <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3 select-none text-slate-600">
          <MessageSquare size={22} className="text-slate-400" />
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Answers Posted</p>
            <p className="text-2xl font-semibold text-slate-800 leading-none mt-1.5 font-sans">{currentUser.stats.answersPosted}</p>
          </div>
        </div>

        <div className="p-4 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center gap-3 select-none text-slate-600">
          <ThumbsUp size={22} className="text-slate-400" />
          <div>
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Upvotes Received</p>
            <p className="text-2xl font-semibold text-slate-800 leading-none mt-1.5 font-sans">{currentUser.stats.upvotesReceived}</p>
          </div>
        </div>
      </div>

      {/* Earned Achievements Badge Showcase */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm">
        <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2 font-sans">
          <Award size={18} className="text-indigo-500" />
          <span>Earned Internship Badges ({earnedBadges.length})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {badgeDetails.map((badge) => (
            <motion.div
              key={badge.name}
              whileHover={badge.req ? { scale: 1.01 } : {}}
              className={`p-4 border rounded-xl flex items-start gap-3 transition-all ${
                badge.req
                  ? 'bg-white border-slate-200 shadow-sm'
                  : 'bg-slate-50/50 border-slate-100 opacity-50'
              }`}
            >
              <div className="text-3xl p-1 bg-slate-50 border border-slate-100 rounded-full flex-shrink-0 w-12 h-12 flex items-center justify-center">
                {badge.req ? badge.icon : '🔒'}
              </div>
              <div>
                <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-1.5">
                  {badge.name}
                  {badge.req && (
                    <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.5 rounded font-semibold">
                      UNLOCKED
                    </span>
                  )}
                </h4>
                <p className="text-[10px] font-normal text-slate-500 mt-1.5 leading-normal">
                  {badge.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
export default Profile;
