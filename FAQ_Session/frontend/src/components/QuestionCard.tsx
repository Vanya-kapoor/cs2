import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';
import { Question } from '../types';
import { StatusBadge } from './CommonWidgets';

interface QuestionCardProps {
  question: Question;
  index: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => navigate(`/questions/${question.id}`)}
      className="p-5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center"
    >
      {/* Left: answer count */}
      <div className="flex md:flex-col gap-3 w-full md:w-20 items-center justify-around md:justify-center border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 pb-3 md:pb-0 md:pr-4 flex-shrink-0">
        <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
          <MessageSquare size={15} />
          <span className="text-xs font-semibold mt-0.5">{question.answers.length}</span>
          <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">answers</span>
        </div>
      </div>

      {/* Middle: Title, description, tags */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={question.status} />
        </div>

        <h3 className="font-semibold text-base md:text-lg leading-snug font-sans text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
          {question.title}
        </h3>

        <p className="text-xs font-normal text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {question.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {question.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-600/50 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right: Author */}
      <div className="flex md:flex-col items-end justify-between md:justify-center h-full w-full md:w-32 border-t md:border-t-0 border-slate-100 dark:border-slate-700 pt-3 md:pt-0 pl-0 md:pl-4 flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 self-end">
          <div className="flex flex-col items-end text-right">
            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-500">Posted by</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[80px]">{question.author.name}</span>
          </div>
          <div className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm shadow-sm overflow-hidden">
            {question.author.avatar?.startsWith('http') ? (
              <img src={question.author.avatar} alt={question.author.name} referrerPolicy="no-referrer"
                className="w-full h-full object-cover" />
            ) : (
              question.author.avatar
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default QuestionCard;
