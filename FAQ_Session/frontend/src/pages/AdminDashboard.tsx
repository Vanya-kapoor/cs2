import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, HelpCircle, ShieldAlert, Award, Star, Trash2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, EmptyState, Skeleton, SkeletonStatsCard, SkeletonCard } from '../components/CommonWidgets';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { questions, faqs, convertToFAQ, deleteQuestion, getStats } = useAppContext();
  const { currentUser, authLoading } = useAuth();

  const stats = getStats();

  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SkeletonStatsCard /><SkeletonStatsCard /><SkeletonStatsCard />
        </div>
        <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <EmptyState
          title="Access Restricted 🔐"
          description="Only registered Admin profiles are allowed to access moderation queues."
        />
      </div>
    );
  }

  const openModerationQueue = questions.filter(q => q.status !== 'RESOLVED');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* Header Banner */}
      <div className="flex items-center gap-3 p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm relative overflow-hidden z-10">
        <div className="absolute right-[-10px] top-[-10px] rotate-12 text-slate-100 dark:text-slate-700 select-none -z-10">
          <ShieldCheck size={90} />
        </div>
        <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 text-xl font-bold flex-shrink-0">
          🛡️
        </div>
        <div>
          <h1 className="font-semibold text-xl tracking-tight text-slate-900 dark:text-slate-100 font-sans">
            Admin Panel &amp; Moderation
          </h1>
          <p className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
            Resolve queries, moderate forum, and endorse official FAQs.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Verified FAQs</p>
          <p className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1 font-sans">{stats.totalFAQs}</p>
        </div>
        <div className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Open Queries</p>
          <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1 font-sans">{stats.openQuestions}</p>
        </div>
        <div className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-slate-400 dark:text-slate-500 tracking-wider">Answered</p>
          <p className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1 font-sans">{stats.answeredQuestions}</p>
        </div>
      </div>

      {/* Moderation Queue */}
      <div className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 font-sans">
          <HelpCircle size={18} className="text-indigo-500 dark:text-indigo-400" />
          <span>Forum Moderation Queue ({openModerationQueue.length})</span>
        </h2>

        {openModerationQueue.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {openModerationQueue.map(q => (
              <div key={q.id} className="p-4 border border-slate-100 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-700/30 rounded-xl flex flex-col gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <StatusBadge status={q.status} />
                </div>
                <div>
                  <h3
                    onClick={() => navigate(`/questions/${q.id}`)}
                    className="font-semibold text-sm hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-slate-800 dark:text-slate-200 transition-colors"
                  >
                    {q.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">{q.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-2.5 mt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-slate-100 dark:border-slate-600 hover:border-rose-200 dark:hover:border-rose-700 rounded transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      By: <span className="font-semibold text-slate-700 dark:text-slate-200">{q.author.name}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">{q.answers.length} replies</span>
                    {q.answers.length > 0 && (
                      <button
                        onClick={() => convertToFAQ(q.id)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-semibold uppercase transition-colors flex items-center gap-0.5 border border-transparent shadow-sm cursor-pointer"
                      >
                        <Award size={9} /><span>Convert to FAQ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 font-medium border border-dashed border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/20 dark:bg-slate-700/20">
            All active forum discussions are clean and moderated.
          </div>
        )}
      </div>

      {/* FAQ Management */}
      <div className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-3 font-sans">
          <ShieldAlert size={18} className="text-rose-500 dark:text-rose-400" />
          <span>Manage Verified FAQs ({faqs.length})</span>
        </h2>

        {faqs.length > 0 ? (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {faqs.map(q => (
              <div key={q.id} className="p-3 border border-slate-100 dark:border-slate-700 rounded-lg flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <span
                    onClick={() => navigate(`/faqs/${q.id}`)}
                    className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                  >
                    {q.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Star size={8} className="fill-emerald-600 dark:fill-emerald-400" />Verified
                  </span>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-slate-100 dark:border-slate-600 hover:border-rose-200 dark:hover:border-rose-700 rounded transition-colors"
                    title="Delete FAQ"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500 font-medium border border-dashed border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50/20 dark:bg-slate-700/20">
            No verified FAQs yet.
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default AdminDashboard;
