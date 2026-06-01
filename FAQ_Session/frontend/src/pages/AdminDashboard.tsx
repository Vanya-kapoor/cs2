import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, HelpCircle, ShieldAlert, Award, Star, Trash2 } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import { useAuth } from '../context/AuthContext';
import { CategoryChip, StatusBadge, EmptyState } from '../components/CommonWidgets';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { questions, convertToFAQ, deleteQuestion, getStats, changeQuestionStatus } = useMockDb();
  const { currentUser } = useAuth();

  const stats = getStats();

  // If not admin, restrict page loading
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <EmptyState
          title="Access Restricted 🔐"
          description="Only registered Admin profiles are allowed to access moderation queues, escalate priority tickets, and convert questions into official FAQs."
        />
        <p className="text-xs text-slate-400 font-medium">
          Tip: You can use the "Switch Role" dropdown in the top navbar to instantly login as Sarah Connor (Admin) to unlock this dashboard!
        </p>
      </div>
    );
  }

  // Get escalated questions
  const escalatedQuestions = questions.filter(q => q.status === 'ESCALATED');

  // Get open questions pending answers or reviews
  const openModerationQueue = questions.filter(q => q.status === 'OPEN' || q.status === 'UNDER_REVIEW');

  // Priority indicator logic
  const getPriority = (category: string) => {
    switch (category.toLowerCase()) {
      case 'stipend': return { label: 'CRITICAL', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
      case 'ppo': return { label: 'HIGH', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'joining formalities': return { label: 'MEDIUM', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default: return { label: 'LOW', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* Header Panel */}
      <div className="flex items-center gap-3 p-5 border border-slate-200 bg-white rounded-2xl shadow-sm text-slate-800 relative overflow-hidden z-10">
        <div className="absolute right-[-10px] top-[-10px] rotate-12 text-slate-100 select-none -z-10">
          <ShieldCheck size={90} />
        </div>
        <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-red-50 text-red-600 text-xl font-bold">
          🛡️
        </div>
        <div>
          <h1 className="font-semibold text-xl tracking-tight text-slate-900 font-sans">
            Admin Panel & Moderation
          </h1>
          <p className="text-xs font-normal text-slate-500 mt-1">
            Resolve escalated queries, moderate intern forums, and endorse official FAQs.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Verified FAQs</p>
          <p className="text-2.5xl font-semibold text-slate-800 mt-1 font-sans">{stats.totalFAQs}</p>
        </div>
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Escalated Tickets</p>
          <p className="text-2.5xl font-semibold text-rose-600 mt-1 font-sans">{stats.escalatedQuestions}</p>
        </div>
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Open Queue</p>
          <p className="text-2.5xl font-semibold text-amber-600 mt-1 font-sans">{stats.openQuestions}</p>
        </div>
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm transition-all duration-200 hover:shadow-md">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Answered Today</p>
          <p className="text-2.5xl font-semibold text-emerald-600 mt-1 font-sans">{stats.answeredQuestions}</p>
        </div>
      </div>

      {/* Main Grid queues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Escalation Queue */}
        <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
          <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
            <ShieldAlert size={18} className="text-rose-500" />
            <span>Escalation Queue ({escalatedQuestions.length})</span>
          </h2>

          {escalatedQuestions.length > 0 ? (
            <div className="space-y-4">
              {escalatedQuestions.map((q) => {
                const priority = getPriority(q.category);
                return (
                  <div
                    key={q.id}
                    className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl flex flex-col gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 text-[9px] font-semibold border rounded-full ${priority.color}`}>
                        {priority.label} PRIORITY
                      </span>
                      <CategoryChip category={q.category} />
                    </div>

                    <div>
                      <h3
                        onClick={() => navigate(`/questions/${q.id}`)}
                        className="font-semibold text-sm hover:text-blue-600 cursor-pointer text-slate-800 transition-colors"
                      >
                        {q.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {q.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                      <div className="text-[10px] text-slate-400 font-medium">
                        Submitted by: <span className="font-semibold text-slate-700">{q.author.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Resolve ticket */}
                        <button
                          onClick={() => changeQuestionStatus(q.id, 'UNDER_REVIEW')}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[9px] font-semibold uppercase text-slate-700 transition-colors shadow-sm cursor-pointer"
                        >
                          Review Ticket
                        </button>
                        <button
                          onClick={() => convertToFAQ(q.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-semibold uppercase transition-colors flex items-center gap-0.5 border border-transparent shadow-sm cursor-pointer"
                        >
                          <Star size={8} className="fill-white" />
                          <span>Convert to FAQ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
              Hooray! No escalated tickets pending resolution.
            </div>
          )}
        </div>

        {/* Question Moderation & FAQ Conversion Queue */}
        <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
          <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
            <HelpCircle size={18} className="text-indigo-500" />
            <span>Forum Moderation Queue ({openModerationQueue.length})</span>
          </h2>

          {openModerationQueue.length > 0 ? (
            <div className="space-y-4">
              {openModerationQueue.map((q) => (
                <div
                  key={q.id}
                  className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl flex flex-col gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={q.status} />
                    <span className="text-[10px] text-slate-400 font-medium">
                      {q.answers.length} replies
                    </span>
                  </div>

                  <div>
                    <h3
                      onClick={() => navigate(`/questions/${q.id}`)}
                      className="font-semibold text-sm hover:text-blue-600 cursor-pointer text-slate-800 transition-colors"
                    >
                      {q.title}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 size={13} />
                    </button>

                    <div className="flex items-center gap-2">
                      {q.answers.length > 0 && (
                        <button
                          onClick={() => convertToFAQ(q.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-semibold uppercase transition-colors flex items-center gap-0.5 border border-transparent shadow-sm cursor-pointer animate-none"
                        >
                          <Award size={9} />
                          <span>Convert to FAQ</span>
                        </button>
                      )}
                      
                      {q.status === 'UNDER_REVIEW' && (
                        <button
                          onClick={() => changeQuestionStatus(q.id, 'RESOLVED')}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 rounded text-[9px] font-semibold uppercase text-slate-700 transition-colors shadow-sm cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
              All active forum discussions are clean and moderated.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
export default AdminDashboard;
