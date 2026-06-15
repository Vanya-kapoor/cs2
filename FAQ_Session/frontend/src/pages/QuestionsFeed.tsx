import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Plus } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import QuestionCard from "../components/QuestionCard";
import { EmptyState, SkeletonCard } from "../components/CommonWidgets";

export const QuestionsFeed: React.FC = () => {
  const navigate = useNavigate();
  const { questions, loading } = useAppContext();
  const [filter, setFilter] = useState<"newest" | "unanswered" | "answered">("newest");

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const filteredQuestions = [...questions].filter((q) => {
    if (q.isOfficial) return false;
    const createdAt = new Date(q.createdAt).getTime();
    if (createdAt < oneWeekAgo) return false;
    if (filter === "unanswered") return q.answers.length === 0;
    if (filter === "answered") return q.answers.length > 0;
    return true;
  });

  const sortedQuestions = filteredQuestions.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-sans flex items-center gap-2">
            <span>Community Forum</span>
            <MessageSquare className="text-blue-500" size={22} />
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-1.5">
            Ask questions, help fellow interns, and verify onboarding details
          </p>
        </div>

        <button
          onClick={() => navigate("/ask")}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors border border-transparent shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Ask Question</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1 bg-white dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 rounded-xl w-fit shadow-sm">
        {(["newest", "unanswered", "answered"] as const).map((opt) => (
          <button
            key={opt}
            onClick={() => setFilter(opt)}
            className={`px-4 py-1.5 font-semibold text-xs uppercase transition-colors rounded-lg ${
              filter === opt
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                : "hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : sortedQuestions.length > 0 ? (
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
