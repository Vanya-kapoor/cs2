import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Question } from '../types';
import { OfficialBadge } from './CommonWidgets';

interface FAQCardProps {
  faq: Question;
  index: number;
}

export const FAQCard: React.FC<FAQCardProps> = ({ faq, index }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={() => navigate(`/questions/${faq.id}`)}
      className="relative p-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[200px]"
    >
      <div>
        {/* Metadata row */}
        <div className="flex items-center justify-end gap-2 mb-3.5">
          {faq.isOfficial && <OfficialBadge type="official" />}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug mb-1.5 text-slate-900 dark:text-slate-100 hover:text-blue-600 transition-colors">
          {faq.title}
        </h3>

        {/* Short Preview */}
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed font-normal">
          {faq.description}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-auto">
        <span className="text-xs font-medium text-slate-400">
          {faq.answers.length} {faq.answers.length === 1 ? 'answer' : 'answers'}
        </span>
        <span className="flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors">
          <ArrowRight size={13} />
        </span>
      </div>
    </motion.div>
  );
};
export default FAQCard;
