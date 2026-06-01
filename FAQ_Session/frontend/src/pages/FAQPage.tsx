import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useMockDb } from '../context/MockDbContext';
import SearchBar from '../components/SearchBar';
import FAQCard from '../components/FAQCard';
import { CategoryChip, EmptyState } from '../components/CommonWidgets';

export const FAQPage: React.FC = () => {
  const { questions } = useMockDb();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [sortBy, setSortBy] = useState<'latest' | 'upvotes' | 'views'>('latest');

  // Keep state sync with route search params
  useEffect(() => {
    const qSearch = searchParams.get('search') || '';
    const qCat = searchParams.get('category') || 'All';
    setSearchQuery(qSearch);
    setSelectedCategory(qCat);
  }, [searchParams]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

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

  const categories = [
    'All',
    'Stipend',
    'PPO',
    'Eligibility',
    'Interview Process',
    'Projects',
    'Joining Formalities',
    'Company Policies',
    'Technical Issues'
  ];

  const faqs = questions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Apply sorting
  const sortedFaqs = [...faqs].sort((a, b) => {
    if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
    if (sortBy === 'views') return b.views - a.views;
    // Default to latest
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Header Info */}
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

      {/* Search & Sorting Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <SearchBar
          placeholder="Search FAQs..."
          value={searchQuery}
          onChange={handleSearchChange}
        />

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 self-start lg:self-auto flex-shrink-0">
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
            <ArrowUpDown size={14} className="text-slate-400" />
            <span>Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold outline-none border-none cursor-pointer text-xs text-slate-800"
            >
              <option value="latest">Latest</option>
              <option value="upvotes">Most Upvoted</option>
              <option value="views">Most Viewed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Category Horizontal Filter List */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 scrollbar-thin">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <SlidersHorizontal size={14} className="text-slate-400 mr-2" />
          {categories.map((cat) => (
            <CategoryChip
              key={cat}
              category={cat === 'All' ? 'All Categories' : cat}
              active={selectedCategory === cat}
              onClick={() => handleCategorySelect(cat)}
            />
          ))}
        </div>
      </div>

      {/* Grid of cards */}
      {sortedFaqs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {sortedFaqs.map((faq, idx) => (
            <FAQCard key={faq.id} faq={faq} index={idx} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No FAQs match your search filters"
          description="Try typing a different keyword, clearing filters, or select a different category to explore resolved intern queries."
        />
      )}
    </motion.div>
  );
};
export default FAQPage;
