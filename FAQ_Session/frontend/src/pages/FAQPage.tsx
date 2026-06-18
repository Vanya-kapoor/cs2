import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import SearchBar from '../components/SearchBar';
import FAQCard from '../components/FAQCard';
import { EmptyState, SkeletonCard } from '../components/CommonWidgets';

export const FAQPage: React.FC = () => {
  const { faqs, loading } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    const newParams = new URLSearchParams(searchParams);
    if (query) {
      newParams.set('search', query);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const filteredFaqs = faqs
    .filter(q => {
      if (!searchQuery) return true;
      const s = searchQuery.toLowerCase();
      return (
        q.title.toLowerCase().includes(s) ||
        q.description.toLowerCase().includes(s) ||
        q.tags.some(t => t.toLowerCase().includes(s))
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans">
            Verified FAQs
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
            Browse official responses and resolved queries
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <SearchBar
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filteredFaqs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {filteredFaqs.map((faq, idx) => (
            <FAQCard key={faq.id} faq={faq} index={idx} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No FAQs match your search"
          description="Try typing a different keyword or clear the search to explore all resolved queries."
        />
      )}
    </motion.div>
  );
};
export default FAQPage;
