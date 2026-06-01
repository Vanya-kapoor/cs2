import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ThumbsUp, Eye } from 'lucide-react';
import { Question } from '../types';
import { CategoryChip, OfficialBadge } from './CommonWidgets';

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
      className="relative p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col justify-between min-h-[200px]"
    >
      <div>
        {/* Metadata row */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <CategoryChip category={faq.category} />
          {faq.isOfficial && <OfficialBadge type="official" />}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug mb-1.5 text-slate-900 hover:text-blue-600 transition-colors">
          {faq.title}
        </h3>

        {/* Short Preview */}
        <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed font-normal">
          {faq.description}
        </p>
      </div>

      {/* Footer statistics */}
      <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <ThumbsUp size={13} className="text-slate-400" />
            <span>{faq.upvotes}</span>
          </span>
          <span className="flex items-center gap-1">
            <Eye size={13} />
            <span>{faq.views}</span>
          </span>
        </div>
        <span className="flex items-center justify-center w-7 h-7 rounded-full border border-slate-200 text-slate-400 bg-white hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors">
          <ArrowRight size={13} />
        </span>
      </div>
    </motion.div>
  );
};
export default FAQCard;
