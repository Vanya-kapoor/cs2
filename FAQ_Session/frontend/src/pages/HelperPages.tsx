import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Layers, TrendingUp, Bookmark, HelpCircle } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import { useAuth } from '../context/AuthContext';
import QuestionCard from '../components/QuestionCard';
import { EmptyState } from '../components/CommonWidgets';

// ==========================================
// 1. Categories
// ==========================================
export const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { questions } = useMockDb();

  const categories = [
    { name: 'Stipend', icon: '💰', count: questions.filter(q => q.category === 'Stipend').length },
    { name: 'PPO', icon: '🎓', count: questions.filter(q => q.category === 'PPO').length },
    { name: 'Eligibility', icon: '⚖️', count: questions.filter(q => q.category === 'Eligibility').length },
    { name: 'Interview Process', icon: '🤝', count: questions.filter(q => q.category === 'Interview Process').length },
    { name: 'Projects', icon: '💻', count: questions.filter(q => q.category === 'Projects').length },
    { name: 'Joining Formalities', icon: '📝', count: questions.filter(q => q.category === 'Joining Formalities').length },
    { name: 'Company Policies', icon: '🏢', count: questions.filter(q => q.category === 'Company Policies').length },
    { name: 'Technical Issues', icon: '🔧', count: questions.filter(q => q.category === 'Technical Issues').length },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-2">
          <span>Explore Categories</span>
          <Layers size={22} className="text-blue-500" />
        </h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
          Browse queries structured by key internship operations
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() => navigate(`/faqs?category=${encodeURIComponent(cat.name)}`)}
            className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 hover:scale-[1.01] transition-all flex flex-col justify-between min-h-[160px] cursor-pointer"
          >
            <span className="text-4xl">{cat.icon}</span>
            <div>
              <h3 className="font-semibold text-base text-slate-800 font-sans mt-3">{cat.name}</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
                {cat.count} resolved FAQs
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// ==========================================
// 2. Trending
// ==========================================
export const Trending: React.FC = () => {
  const { questions } = useMockDb();

  // Sort questions by views
  const trendingList = [...questions]
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-2">
          <span>Trending Queries</span>
          <TrendingUp size={22} className="text-indigo-500" />
        </h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
          View discussions receiving high traffic and upvotes
        </p>
      </div>

      <div className="space-y-4">
        {trendingList.map((question, idx) => (
          <QuestionCard key={question.id} question={question} index={idx} />
        ))}
      </div>
    </motion.div>
  );
};

// ==========================================
// 3. Bookmarks
// ==========================================
export const Bookmarks: React.FC = () => {
  const { currentUser, openLoginModal } = useAuth();
  const { questions } = useMockDb();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <EmptyState
          title="Sign in to view Bookmarks"
          description="Keep track of questions you've saved for future references."
        />
        <button
          onClick={openLoginModal}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          Login Instantly 🔓
        </button>
      </div>
    );
  }

  const bookmarkedList = questions.filter(q => q.bookmarkedBy.includes(currentUser.id));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-2">
          <span>My Bookmarks</span>
          <Bookmark size={22} className="text-blue-500" />
        </h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
          Access questions you have bookmarked
        </p>
      </div>

      {bookmarkedList.length > 0 ? (
        <div className="space-y-4">
          {bookmarkedList.map((question, idx) => (
            <QuestionCard key={question.id} question={question} index={idx} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No bookmarks saved"
          description="Click the bookmark icon on any question card inside feeds or details page to pin it here."
        />
      )}
    </motion.div>
  );
};

// ==========================================
// 4. MyQuestions
// ==========================================
export const MyQuestions: React.FC = () => {
  const { currentUser, openLoginModal } = useAuth();
  const { questions } = useMockDb();

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <EmptyState
          title="Sign in to view My Questions"
          description="See all active and resolved discussions started by you."
        />
        <button
          onClick={openLoginModal}
          className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          Login Instantly 🔓
        </button>
      </div>
    );
  }

  const myQuestionsList = questions.filter(q => q.author.id === currentUser.id);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans flex items-center gap-2">
          <span>My Questions</span>
          <HelpCircle size={22} className="text-blue-500" />
        </h1>
        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
          Review onboarding and stipends tickets submitted by you
        </p>
      </div>

      {myQuestionsList.length > 0 ? (
        <div className="space-y-4">
          {myQuestionsList.map((question, idx) => (
            <QuestionCard key={question.id} question={question} index={idx} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="You haven't asked any questions"
          description="Got onboarding issues or stipend delays? Head over to the Ask page to notify our mentors!"
        />
      )}
    </motion.div>
  );
};
export default Categories;
