import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '../context/AppContext';
import SearchBar from '../components/SearchBar';
import FAQCard from '../components/FAQCard';
import { EmptyState } from '../components/CommonWidgets';

export const FAQPage: React.FC = () => {
  const { questions } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || ''
  );

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);

    const newParams = new URLSearchParams(searchParams);
    if (query) newParams.set('search', query);
    else newParams.delete('search');

    setSearchParams(newParams);
  };

  // 🔥 CORE FIX: Only show verified FAQs
  const faqs = questions
    .filter(q => q.isOfficial) // ✅ ONLY FAQs
    .filter(q => {
      const search = searchQuery.toLowerCase();

      return (
        q.title.toLowerCase().includes(search) ||
        q.description.toLowerCase().includes(search) ||
        q.tags.some(t => t.toLowerCase().includes(search))
      );
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-sans">
            Verified FAQs
          </h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
            Browse official verified FAQs
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <SearchBar
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      {/* FAQs Grid */}
      {faqs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {faqs.map((faq, idx) => (
            <FAQCard key={faq.id} faq={faq} index={idx} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No FAQs found"
          description="Try a different keyword or clear the search."
        />
      )}
    </motion.div>
  );
};

export default FAQPage;