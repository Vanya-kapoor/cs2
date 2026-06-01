import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, ThumbsUp, Eye, Bookmark, Bell } from 'lucide-react';
import { Question } from '../types';
import { useMockDb } from '../context/MockDbContext';
import { useAuth } from '../context/AuthContext';
import { CategoryChip, StatusBadge } from './CommonWidgets';

interface QuestionCardProps {
  question: Question;
  index: number;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, index }) => {
  const navigate = useNavigate();
  const { upvoteQuestion, bookmarkQuestion, followQuestion } = useMockDb();
  const { currentUser } = useAuth();

  const isUpvoted = currentUser ? question.upvotedBy.includes(currentUser.id) : false;
  const isBookmarked = currentUser ? question.bookmarkedBy.includes(currentUser.id) : false;
  const isFollowed = currentUser ? question.followedBy.includes(currentUser.id) : false;

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    upvoteQuestion(question.id);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    bookmarkQuestion(question.id);
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    followQuestion(question.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
      onClick={() => navigate(`/questions/${question.id}`)}
      className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center"
    >
      {/* Left section: Stats counters */}
      <div className="flex md:flex-col gap-3 w-full md:w-24 items-center justify-around md:justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-3 md:pb-0 md:pr-4 flex-shrink-0">
        <button
          onClick={handleUpvote}
          className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-xs font-semibold w-14 transition-colors ${
            isUpvoted
              ? 'bg-blue-50 border-blue-200 text-blue-700'
              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <ThumbsUp size={13} className={isUpvoted ? 'fill-blue-600' : ''} />
          <span className="text-xs font-semibold mt-0.5">{question.upvotes}</span>
        </button>

        <div className="flex flex-col items-center justify-center text-slate-500">
          <MessageSquare size={15} />
          <span className="text-xs font-semibold mt-0.5">{question.answers.length}</span>
          <span className="text-[9px] uppercase font-bold text-slate-400">answers</span>
        </div>

        <div className="flex flex-col items-center justify-center text-slate-400">
          <Eye size={15} />
          <span className="text-xs font-semibold mt-0.5">{question.views}</span>
          <span className="text-[9px] uppercase font-bold text-slate-400">views</span>
        </div>
      </div>

      {/* Main middle section: Title, description, tags, category */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip category={question.category} />
          <StatusBadge status={question.status} />
          {question.needsAttention && (
            <span className="px-2.5 py-0.5 text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
              Needs Attention
            </span>
          )}
        </div>

        <h3 className="font-semibold text-base md:text-lg leading-snug font-sans text-slate-900 hover:text-blue-600 transition-colors line-clamp-2">
          {question.title}
        </h3>

        <p className="text-xs font-normal text-slate-500 leading-relaxed line-clamp-2">
          {question.description}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {question.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200/50 rounded-md">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Right section: Author & Quick bookmarks */}
      <div className="flex md:flex-col items-end justify-between md:justify-center h-full w-full md:w-32 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 pl-0 md:pl-4 flex-shrink-0 gap-2">
        {/* Quick Action buttons */}
        <div className="flex items-center gap-1.5 self-start md:self-end">
          <button
            onClick={handleBookmark}
            className={`p-1.5 rounded-lg border shadow-sm transition-colors ${
              isBookmarked
                ? 'bg-pink-50 border-pink-200 text-pink-600'
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
            title="Bookmark"
          >
            <Bookmark size={13} className={isBookmarked ? 'fill-pink-600' : ''} />
          </button>
          <button
            onClick={handleFollow}
            className={`p-1.5 rounded-lg border shadow-sm transition-colors ${
              isFollowed
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
            title="Follow question notifications"
          >
            <Bell size={13} className={isFollowed ? 'fill-blue-600' : ''} />
          </button>
        </div>

        {/* Author info */}
        <div className="flex items-center gap-2 self-end">
          <div className="flex flex-col items-end text-right">
            <span className="text-[9px] font-medium text-slate-400">Posted by</span>
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[80px]">{question.author.name}</span>
          </div>
          <div className="w-7 h-7 rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-sm shadow-sm">
            {question.author.avatar}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default QuestionCard;
