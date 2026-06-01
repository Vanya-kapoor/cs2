import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Plus } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import QuestionCard from '../components/QuestionCard';
import { EmptyState } from '../components/CommonWidgets';

export const QuestionsFeed: React.FC = () => {
  const navigate = useNavigate();
  const { questions } = useMockDb();
  const [filter, setFilter] = useState<'newest' | 'trending' | 'upvoted' | 'unanswered'>('newest');

  // Filter & sort questions
  const filteredQuestions = [...questions].filter(q => {
    if (filter === 'unanswered') {
      return q.answers.length === 0;
    }
    return true;
  });

  const sortedQuestions = filteredQuestions.sort((a, b) => {
    if (filter === 'trending') {
      return b.views - a.views;
    }
    if (filter === 'upvoted') {
      return b.upvotes - a.upvotes;
    }
    // newest (default)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-2">
            <span>Community Forum</span>
            <MessageSquare className="text-blue-500" size={22} />
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
            Ask questions, help fellow interns, and verify onboarding details
          </p>
        </div>

        <button
          onClick={() => navigate('/ask')}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors border border-transparent shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Ask Question</span>
        </button>
      </div>

      {/* Sorting Selectors */}
      <div className="flex flex-wrap items-center gap-1 bg-white p-1 border border-slate-200 rounded-xl w-fit shadow-sm">
        {(['newest', 'trending', 'upvoted', 'unanswered'] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-4 py-1.5 font-semibold text-xs uppercase transition-colors rounded-lg ${
              filter === opt
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
            }`}
          >
            {opt === 'upvoted' ? 'Most Upvoted' : opt}
          </button>
        ))}
      </div>

      {/* Feed list */}
      {sortedQuestions.length > 0 ? (
        <div className="space-y-4">
          {sortedQuestions.map((question, idx) => (
            <QuestionCard key={question.id} question={question} index={idx} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No questions in this feed"
          description="It looks like everything has been resolved, or no queries match your filter criteria. Be the first to ask!"
        />
      )}
    </motion.div>
  );
};
export default QuestionsFeed;
