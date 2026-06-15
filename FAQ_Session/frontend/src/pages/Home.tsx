import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, MessageSquare } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import SearchBar from '../components/SearchBar';
import { StatsCard } from '../components/CommonWidgets';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { questions, getStats, loading } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = getStats();

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/faqs?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/faqs');
    }
  };

  const recentQuestions = [...questions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentlyAnswered = [...questions]
    .filter(q => q.status === 'ANSWERED' || q.status === 'RESOLVED')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* Hero Banner */}
      <div className="relative p-8 md:p-12 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col items-center text-center z-10">
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-800/50 -z-10" />

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 max-w-2xl mb-3 font-sans">
          Find answers. Share knowledge. Help future interns.
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-8 font-normal">
          Welcome to <span className="font-semibold text-blue-600">Yaksha FAQ</span>! Ask onboarding questions, check stipends, and verify evaluations.
        </p>

        <SearchBar
          placeholder="Search internship questions (e.g. stipend, PPO review)..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
        />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total FAQs" value={stats.totalFAQs} color="bg-white" icon="❓" />
        <StatsCard title="Open Queries" value={stats.openQuestions} color="bg-white" icon="💬" />
        <StatsCard title="Answered" value={stats.answeredQuestions} color="bg-white" icon="✅" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Questions */}
        <div className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 font-sans">
            <MessageSquare size={18} className="text-blue-500" />
            <span>Recent Questions</span>
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentQuestions.length > 0 ? (
            <div className="space-y-3">
              {recentQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/questions/${q.id}`)}
                  className="p-3.5 border border-slate-100 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-700/40 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-all cursor-pointer flex gap-3 items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="inline font-semibold text-sm hover:text-blue-600 transition-colors text-slate-800 dark:text-slate-200">
                      {q.title}
                    </h3>
                  </div>
                  <span className="text-[9px] uppercase font-semibold px-2 py-0.5 rounded-full border flex-shrink-0
                    bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600">
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No queries yet.</p>
          )}
        </div>

        {/* Recently Resolved */}
        <div className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
          <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2 font-sans">
            <Award size={18} className="text-emerald-500" />
            <span>Recently Resolved</span>
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentlyAnswered.length > 0 ? (
            <div className="space-y-3">
              {recentlyAnswered.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/questions/${q.id}`)}
                  className="p-3.5 border border-slate-100 dark:border-slate-700 rounded-lg bg-emerald-50/10 dark:bg-emerald-900/10 hover:bg-emerald-50/20 dark:hover:bg-emerald-900/20 hover:border-emerald-100/50 dark:hover:border-emerald-800/50 transition-all cursor-pointer flex gap-3 items-start justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-sm hover:text-blue-600 text-slate-800 dark:text-slate-200">
                      {q.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-normal line-clamp-1 mt-1">
                      💡 {q.answers[0]?.content || 'Answer pending official confirmation.'}
                    </p>
                  </div>
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full uppercase font-semibold tracking-wider flex-shrink-0">
                    Resolved
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No resolved queries yet.</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};
export default Home;
