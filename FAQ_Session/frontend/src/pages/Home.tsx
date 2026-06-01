import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, AlertCircle, Award, Users, TrendingUp, HelpCircle } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import SearchBar from '../components/SearchBar';
import { StatsCard } from '../components/CommonWidgets';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { questions, getStats } = useMockDb();
  const [searchQuery, setSearchQuery] = useState('');

  const stats = getStats();

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/faqs?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/faqs');
    }
  };

  const popularCategories = [
    { name: 'Stipend', icon: '💰', color: 'bg-white', count: questions.filter(q => q.category === 'Stipend').length },
    { name: 'PPO', icon: '🎓', color: 'bg-white', count: questions.filter(q => q.category === 'PPO').length },
    { name: 'Eligibility', icon: '⚖️', color: 'bg-white', count: questions.filter(q => q.category === 'Eligibility').length },
    { name: 'Interview Process', icon: '🤝', color: 'bg-white', count: questions.filter(q => q.category === 'Interview Process').length },
    { name: 'Projects', icon: '💻', color: 'bg-white', count: questions.filter(q => q.category === 'Projects').length },
    { name: 'Joining Formalities', icon: '📝', color: 'bg-white', count: questions.filter(q => q.category === 'Joining Formalities').length },
    { name: 'Company Policies', icon: '🏢', color: 'bg-white', count: questions.filter(q => q.category === 'Company Policies').length },
    { name: 'Technical Issues', icon: '🔧', color: 'bg-white', count: questions.filter(q => q.category === 'Technical Issues').length },
  ];

  // Get top 3 trending questions (most views)
  const trendingQuestions = [...questions]
    .sort((a, b) => b.views - a.views)
    .slice(0, 3);

  // Get 3 recently answered questions
  const recentlyAnswered = [...questions]
    .filter(q => q.status === 'ANSWERED' || q.status === 'RESOLVED')
    .sort((a, b) => b.answers.length - a.answers.length) // placeholder logic
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* SaaS Hero Banner */}
      <div className="relative p-8 md:p-12 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col items-center text-center z-10">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/40 via-white to-indigo-50/20 -z-10" />

        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 max-w-2xl mb-3 font-sans">
          Find answers. Share knowledge. Help future interns.
        </h1>
        <p className="text-sm text-slate-500 max-w-md mb-8 font-normal">
          Welcome to <span className="font-semibold text-blue-600">Yaksha FAQ</span>! Ask onboarding questions, check stipends, and verify evaluations.
        </p>

        {/* Large Search Box */}
        <SearchBar
          placeholder="Search internship questions (e.g. stipend, PPO review)..."
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
        />
      </div>

      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total FAQs" value={stats.totalFAQs} color="bg-white" icon="❓" />
        <StatsCard title="Open Queries" value={stats.openQuestions} color="bg-white" icon="💬" />
        <StatsCard title="Escalated Cases" value={stats.escalatedQuestions} color="bg-white" icon="🚨" />
        <StatsCard title="Active Contributors" value={stats.activeInterns} color="bg-white" icon="🧑‍💻" />
      </div>

      {/* Main Grid: Trending & Recently Answered */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left/Middle Column: Trending and Recently Answered */}
        <div className="lg:col-span-2 space-y-8">
          {/* Trending Questions */}
          <div className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2 font-sans">
              <TrendingUp size={18} className="text-indigo-500" />
              <span>Trending Queries</span>
            </h2>

            <div className="space-y-3">
              {trendingQuestions.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/questions/${q.id}`)}
                  className="p-3.5 border border-slate-100 rounded-lg bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer flex gap-3 items-center justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] bg-slate-100 border border-slate-200/50 text-slate-600 px-1.5 py-0.5 rounded-md font-medium mr-2.5">
                      {q.category}
                    </span>
                    <h3 className="inline font-semibold text-sm hover:text-blue-600 transition-colors text-slate-800">
                      {q.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                    <span>👍 {q.upvotes}</span>
                    <span>👀 {q.views}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recently Answered */}
          <div className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm">
            <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2 font-sans">
              <Award size={18} className="text-emerald-500" />
              <span>Recently Resolved</span>
            </h2>

            <div className="space-y-3">
              {recentlyAnswered.map((q) => (
                <div
                  key={q.id}
                  onClick={() => navigate(`/questions/${q.id}`)}
                  className="p-3.5 border border-slate-100 rounded-lg bg-emerald-50/10 hover:bg-emerald-50/20 hover:border-emerald-100/50 transition-all cursor-pointer flex gap-3 items-start justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-sm hover:text-blue-600 text-slate-800">
                      {q.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-normal line-clamp-1 mt-1">
                      💡 {q.answers[0]?.content || 'Answer pending official confirmation.'}
                    </p>
                  </div>
                  <span className="text-[9px] bg-emerald-50 border border-emerald-200/50 text-emerald-700 px-2.5 py-0.5 rounded-full uppercase font-semibold tracking-wider flex-shrink-0">
                    Resolved
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Categories Panel */}
        <div className="p-6 border border-slate-200 bg-white rounded-xl shadow-sm self-start">
          <h2 className="font-semibold text-lg text-slate-800 mb-4 flex items-center gap-2 font-sans">
            <HelpCircle size={18} className="text-blue-500" />
            <span>Popular Categories</span>
          </h2>

          <div className="grid grid-cols-1 gap-2.5">
            {popularCategories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => navigate(`/faqs?category=${encodeURIComponent(cat.name)}`)}
                className="w-full p-3 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 shadow-sm transition-colors flex items-center justify-between font-semibold text-slate-700 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <span className="text-xs font-semibold text-slate-700">{cat.name}</span>
                </div>
                <span className="text-[10px] bg-slate-100 border border-slate-200/50 text-slate-500 px-2 py-0.5 rounded-md font-medium">
                  {cat.count} FAQs
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default Home;
