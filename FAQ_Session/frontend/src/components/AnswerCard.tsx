import React from 'react';
import { motion } from 'framer-motion';
import { ThumbsUp, Check } from 'lucide-react';
import { Answer } from '../types';
import { useAuth } from '../context/AuthContext';
import { useMockDb } from '../context/MockDbContext';
import { OfficialBadge } from './CommonWidgets';

interface AnswerCardProps {
  answer: Answer;
  questionAuthorId: string;
  isQuestionResolved: boolean;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ answer, questionAuthorId, isQuestionResolved }) => {
  const { currentUser } = useAuth();
  const { upvoteAnswer, acceptAnswer } = useMockDb();

  const handleUpvote = () => {
    upvoteAnswer(answer.questionId, answer.id);
  };

  const handleAccept = () => {
    acceptAnswer(answer.questionId, answer.id);
  };

  // Can the current user accept solutions?
  // Only if they are the author of the question, or they are an Admin!
  const canAccept = currentUser && (currentUser.id === questionAuthorId || currentUser.role === 'ADMIN');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-5 border border-slate-200 bg-white rounded-xl shadow-sm relative ${
        answer.isAccepted ? 'border-emerald-500 bg-emerald-50/10' : ''
      }`}
    >
      {/* Ribbon for accepted answers */}
      {answer.isAccepted && (
        <div className="absolute top-[-10px] right-4 bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 rounded-full shadow-sm border border-emerald-500 animate-none">
          <Check size={10} />
          <span>Pinned Solution</span>
        </div>
      )}

      {/* Answer Header: Author info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-slate-200 rounded-full bg-slate-50 flex items-center justify-center text-xl shadow-sm">
            {answer.author.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-800">{answer.author.name}</span>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded leading-none uppercase font-semibold">
                {answer.author.role}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                🏆 {answer.author.stats.reputation} Rep
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Replied on {new Date(answer.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
          </div>
        </div>

        {/* Official status badges */}
        <div className="flex flex-col items-end gap-1.5">
          {answer.isOfficial && <OfficialBadge type="official" />}
          {answer.isAccepted && !answer.isOfficial && <OfficialBadge type="accepted" />}
        </div>
      </div>

      {/* Answer Content */}
      <p className="text-xs md:text-sm font-normal text-slate-700 whitespace-pre-line leading-relaxed mb-4">
        {answer.content}
      </p>

      {/* Actions Row */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3">
        {/* Upvoting */}
        <button
          onClick={handleUpvote}
          className="flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm transition-colors text-xs font-semibold"
        >
          <ThumbsUp size={12} className="text-slate-400" />
          <span>{answer.upvotes} Upvotes</span>
        </button>

        {/* Pin as Accepted button */}
        {canAccept && !answer.isAccepted && !isQuestionResolved && (
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors border border-transparent"
          >
            <Check size={12} />
            <span>Accept Solution</span>
          </button>
        )}
      </div>
    </motion.div>
  );
};
export default AnswerCard;
