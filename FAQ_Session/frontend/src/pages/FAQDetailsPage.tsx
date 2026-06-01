import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThumbsUp, Eye, Bell, ArrowLeft, Send, Sparkles } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import { useAuth } from '../context/AuthContext';
import { CategoryChip, StatusBadge } from '../components/CommonWidgets';
import AnswerCard from '../components/AnswerCard';
import EscalationTimeline from '../components/EscalationTimeline';

export const FAQDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { questions, upvoteQuestion, followQuestion, postAnswer, escalateQuestion } = useMockDb();
  const { currentUser, openLoginModal } = useAuth();
  const [answerInput, setAnswerInput] = useState('');

  const question = questions.find(q => q.id === id);

  // Increment views in fake reactive cycle (simulated on mount)
  React.useEffect(() => {
    if (question) {
      question.views += 1;
    }
  }, [id, question]);

  if (!question) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-slate-800 font-sans">Question Not Found</h2>
        <button
          onClick={() => navigate('/questions')}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors"
        >
          Back to Questions
        </button>
      </div>
    );
  }

  const isUpvoted = currentUser ? question.upvotedBy.includes(currentUser.id) : false;
  const isFollowed = currentUser ? question.followedBy.includes(currentUser.id) : false;

  const handleUpvote = () => {
    upvoteQuestion(question.id);
  };

  const handleFollow = () => {
    followQuestion(question.id);
  };

  const handleEscalate = () => {
    if (!currentUser) {
      openLoginModal();
      return;
    }
    escalateQuestion(question.id);
  };

  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      openLoginModal();
      return;
    }
    if (!answerInput.trim()) return;

    postAnswer(question.id, answerInput.trim());
    setAnswerInput('');
  };

  // Sort answers to place accepted answer at the very top!
  const sortedAnswers = [...question.answers].sort((a, b) => {
    if (a.isAccepted) return -1;
    if (b.isAccepted) return 1;
    return b.upvotes - a.upvotes;
  });

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
        className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft size={14} />
        <span>Go Back</span>
      </button>

      {/* Main Question Card wrapper */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        {/* Header tags */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip category={question.category} />
            <StatusBadge status={question.status} />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Asked {new Date(question.createdAt).toLocaleDateString(undefined, {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl md:text-3xl font-semibold text-slate-900 font-sans leading-tight">
          {question.title}
        </h1>

        {/* Author Panel */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl w-fit shadow-none">
          <div className="w-8 h-8 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-lg shadow-sm">
            {question.author.avatar}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-800 leading-none">{question.author.name}</span>
              <span className="text-[8px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded leading-none uppercase font-semibold">
                {question.author.role}
              </span>
            </div>
            <p className="text-[9px] text-slate-500 font-medium leading-none mt-1">
              🏆 {question.author.stats.reputation} Reputation
            </p>
          </div>
        </div>

        {/* Content Body */}
        <p className="text-xs md:text-sm font-normal text-slate-600 whitespace-pre-line leading-relaxed pt-2">
          {question.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          {question.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/50 rounded-md">
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer Interaction Stats */}
        <div className="flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 gap-4">
          <div className="flex items-center gap-3">
            {/* Upvote */}
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors text-xs font-semibold ${
                isUpvoted
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <ThumbsUp size={13} className={isUpvoted ? 'fill-blue-600 text-blue-600' : 'text-slate-400'} />
              <span>{question.upvotes} Upvotes</span>
            </button>

            {/* Follow */}
            <button
              onClick={handleFollow}
              className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg transition-colors text-xs font-semibold ${
                isFollowed
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Bell size={13} className={isFollowed ? 'fill-blue-600 text-blue-600' : 'text-slate-400'} />
              <span>
                {question.followers} {question.followers === 1 ? 'Follower' : 'Followers'}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
            <span className="flex items-center gap-1">
              <Eye size={14} />
              <span>{question.views} Views</span>
            </span>
            {/* Escalation button */}
            {question.status === 'OPEN' && (
              <button
                onClick={handleEscalate}
                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-semibold uppercase hover:bg-rose-100 transition-colors shadow-sm"
              >
                Escalate Question 🚨
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Escalation Pipeline Progress Visualizer */}
      <EscalationTimeline status={question.status} />

      {/* Answers Section Header */}
      <div className="space-y-4 pt-4">
        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 font-sans">
          <span>Replies ({question.answers.length})</span>
          {question.isAccepted && (
            <span className="px-2.5 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-semibold uppercase tracking-wider">
              Accepted Solution Pinned
            </span>
          )}
        </h2>

        {/* Answers List */}
        {sortedAnswers.length > 0 ? (
          <div className="space-y-4">
            {sortedAnswers.map((ans) => (
              <AnswerCard
                key={ans.id}
                answer={ans}
                questionAuthorId={question.author.id}
                isQuestionResolved={question.isAccepted}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 border border-slate-200 bg-white text-center rounded-xl text-xs font-medium text-slate-400">
            No answers posted yet. Help this intern by sharing your knowledge!
          </div>
        )}
      </div>

      {/* Answer Formulation Box */}
      <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm">
        <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2 text-slate-800">
          <Sparkles className="text-blue-500" size={18} />
          <h3 className="font-semibold text-sm uppercase tracking-wide font-sans">Submit Helpful Answer</h3>
        </div>

        {currentUser ? (
          <form onSubmit={handleSubmitAnswer} className="space-y-3">
            <textarea
              rows={4}
              placeholder="Provide a detailed, helpful resolution with official links or past examples..."
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm font-normal outline-none bg-slate-50/50 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
              required
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors border border-transparent shadow-sm"
            >
              <Send size={13} />
              <span>Submit Resolution</span>
            </button>
          </form>
        ) : (
          <div className="text-center py-4 space-y-2.5">
            <p className="text-xs text-slate-500 font-medium">
              You must be logged in to contribute an answer to this query.
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
    </motion.div>
  );
};
export default FAQDetailsPage;
