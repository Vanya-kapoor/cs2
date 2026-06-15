import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { Answer } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { OfficialBadge } from './CommonWidgets';

interface AnswerCardProps {
  answer: Answer;
  questionAuthorId: string;
  isQuestionResolved: boolean;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({ answer, questionAuthorId, isQuestionResolved }) => {
  const { currentUser } = useAuth();
  const { acceptAnswer, deleteReply } = useAppContext();
  const [deleting, setDeleting] = useState(false);

  const handleAccept = () => {
    acceptAnswer(answer.questionId, answer.id);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;
    setDeleting(true);
    try {
      await deleteReply(answer.questionId, answer.id);
    } catch {
      // error is already surfaced as a toast by deleteReply in AppContext
    } finally {
      setDeleting(false);
    }
  };

  const canAccept = currentUser && (currentUser.id === questionAuthorId || currentUser.role === 'ADMIN');
  const canDelete = currentUser && (currentUser.id === answer.author.id || currentUser.role === 'ADMIN');

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
        <div className="absolute top-[-10px] right-4 bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 rounded-full shadow-sm border border-emerald-500">
          <Check size={10} />
          <span>Pinned Solution</span>
        </div>
      )}

      {/* Answer Header: Author info */}
      <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border border-slate-200 rounded-full bg-slate-50 flex items-center justify-center text-xl shadow-sm overflow-hidden">
            {answer.author.avatar?.startsWith('http') ? (
              <img src={answer.author.avatar} alt={answer.author.name} referrerPolicy="no-referrer"
                className="w-full h-full object-cover" />
            ) : (
              answer.author.avatar
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm text-slate-800">{answer.author.name}</span>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded leading-none uppercase font-semibold">
                {answer.author.role}
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

        {/* Official status badges + delete */}
        <div className="flex flex-col items-end gap-1.5">
          {answer.isOfficial && <OfficialBadge type="official" />}
          {answer.isAccepted && !answer.isOfficial && <OfficialBadge type="accepted" />}
          {canDelete && !answer.isAccepted && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 text-rose-500 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded transition-colors disabled:opacity-40 cursor-pointer"
              title="Delete Reply"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Answer Content */}
      <p className="text-xs md:text-sm font-normal text-slate-700 whitespace-pre-line leading-relaxed mb-4">
        {answer.content}
      </p>

      {/* Accept button (admin or question author) */}
      {canAccept && !answer.isAccepted && !isQuestionResolved && (
        <div className="flex items-center justify-end border-t border-slate-100 pt-3">
          <button
            onClick={handleAccept}
            className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors border border-transparent"
          >
            <Check size={12} />
            <span>Accept Solution</span>
          </button>
        </div>
      )}
    </motion.div>
  );
};
export default AnswerCard;
