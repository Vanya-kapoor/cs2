import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Sparkles, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, Skeleton } from '../components/CommonWidgets';
import AnswerCard from '../components/AnswerCard';

export const FAQDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { questions, faqs, loading, postAnswer } = useAppContext();
  const { currentUser, openLoginModal } = useAuth();
  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const faq = faqs.find(q => q.id === id);
  const question = faq ?? questions.find(q => q.id === id);
  const isFaqView = Boolean(faq);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-4 w-24" />
        <div className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm space-y-4">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 font-sans">Not Found</h2>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { openLoginModal(); return; }
    if (!answerInput.trim()) return;
    setSubmitting(true);
    try {
      await postAnswer(question.id, answerInput.trim());
      setAnswerInput('');
    } catch (err) {
      console.error('Failed to submit answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const displayedAnswers = isFaqView
    ? question.answers.filter(a => a.isAccepted)
    : [...question.answers].sort((a, b) => {
        if (a.isAccepted) return -1;
        if (b.isAccepted) return 1;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });

  const isResolved = question.status === 'RESOLVED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Go Back</span>
      </button>

      {/* FAQ verified banner */}
      {isFaqView && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
          <ShieldCheck size={14} />
          <span>This is a verified FAQ — the answer below has been officially approved.</span>
        </div>
      )}

      {/* Main Question Card */}
      <div className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={question.status} />
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
            Asked {new Date(question.createdAt).toLocaleDateString(undefined, {
              month: 'long', day: 'numeric', year: 'numeric'
            })}
          </span>
        </div>

        <h1 className="text-xl md:text-3xl font-semibold text-slate-900 dark:text-slate-100 font-sans leading-tight">
          {question.title}
        </h1>

        {/* Author chip */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl w-fit">
          <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg shadow-sm overflow-hidden">
            {question.author.avatar?.startsWith('http') ? (
              <img src={question.author.avatar} alt={question.author.name} referrerPolicy="no-referrer"
                className="w-full h-full object-cover" />
            ) : question.author.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">
                {question.author.name}
              </span>
              <span className="text-[8px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded leading-none uppercase font-semibold">
                {question.author.role}
              </span>
            </div>
          </div>
        </div>

        {question.description && question.description !== 'Official verified FAQ answer.' && (
          <p className="text-xs md:text-sm font-normal text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed pt-2">
            {question.description}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {question.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-4 border-t border-slate-100 dark:border-slate-700 pt-4 text-xs font-semibold text-slate-400 dark:text-slate-500">
          <span>{displayedAnswers.length} {isFaqView ? 'Answer' : 'Replies'}</span>
        </div>
      </div>

      {/* Replies / Answers header */}
      <div className="space-y-4 pt-4">
        <h2 className="font-semibold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2 font-sans">
          <span>{isFaqView ? 'Official Answer' : `Replies (${displayedAnswers.length})`}</span>
          {!isFaqView && isResolved && (
            <span className="px-2.5 py-0.5 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 rounded-full font-semibold uppercase tracking-wider">
              Accepted Solution Pinned
            </span>
          )}
        </h2>

        {displayedAnswers.length > 0 ? (
          <div className="space-y-4">
            {displayedAnswers.map(ans => (
              <AnswerCard
                key={ans.id}
                answer={ans}
                questionAuthorId={question.author.id}
                isQuestionResolved={isResolved}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-center rounded-xl text-xs font-medium text-slate-400 dark:text-slate-500">
            {isFaqView ? 'No official answer available.' : 'No replies yet. Be the first to help!'}
          </div>
        )}
      </div>

      {/* Reply form — only for queries */}
      {!isFaqView && (
        isResolved ? (
          <div className="p-5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
            This question has been resolved. No further replies can be added.
          </div>
        ) : (
          <div className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 dark:border-slate-700 pb-2 text-slate-800 dark:text-slate-100">
              <Sparkles className="text-blue-500" size={18} />
              <h3 className="font-semibold text-sm uppercase tracking-wide font-sans">Submit Helpful Answer</h3>
            </div>

            {currentUser ? (
              <form onSubmit={handleSubmitAnswer} className="space-y-3">
                <textarea
                  rows={4}
                  placeholder="Provide a detailed, helpful answer..."
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-normal outline-none bg-slate-50/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  required
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg font-semibold text-sm transition-colors border border-transparent shadow-sm"
                >
                  <Send size={13} />
                  <span>{submitting ? 'Submitting...' : 'Submit Answer'}</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-4 space-y-2.5">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  You must be logged in to post a reply.
                </p>
                <button
                  onClick={openLoginModal}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                >
                  Log In to Answer 🔓
                </button>
              </div>
            )}
          </div>
        )
      )}
    </motion.div>
  );
};
export default FAQDetailsPage;
