// src/pages/AskQuestion.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, FileText, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { Question } from '../types';

export const AskQuestion: React.FC = () => {
  const navigate = useNavigate();
  const { askQuestion, questions } = useAppContext();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [similarQuestions, setSimilarQuestions] = useState<Question[]>([]);
  const [titleError, setTitleError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [submitError, setSubmitError] = useState('');

  // Dynamic "Similar Questions" check
  useEffect(() => {
    if (title.trim().length > 3) {
      const matches = questions.filter(q =>
        q.title.toLowerCase().includes(title.toLowerCase())
      ).slice(0, 3);
      setSimilarQuestions(matches);
    } else {
      setSimilarQuestions([]);
    }
  }, [title, questions]);

  const validate = (): boolean => {
    let valid = true;
    setTitleError('');
    setDescriptionError('');

    if (!title.trim()) {
      setTitleError('Question title is required.');
      valid = false;
    } else if (title.trim().length < 5) {
      setTitleError('Title must be at least 5 characters.');
      valid = false;
    } else if (title.trim().length > 200) {
      setTitleError('Title must be at most 200 characters.');
      valid = false;
    }

    if (!description.trim()) {
      setDescriptionError('Please provide some context for your question.');
      valid = false;
    } else if (description.trim().length < 10) {
      setDescriptionError('Description must be at least 10 characters.');
      valid = false;
    }

    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validate()) return;

    try {
      await askQuestion(title.trim(), description.trim());
      navigate('/questions');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.title?.[0] ||
        err?.response?.data?.errors?.description?.[0] ||
        err?.message ||
        'Failed to submit question. Please try again.';
      setSubmitError(msg);
    }
  };

  const inputBase =
    'w-full p-3 border rounded-lg outline-none text-sm font-normal placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all';
  const inputErrorClass = 'border-red-300 focus:border-red-400 focus:ring-red-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="max-w-2xl mx-auto"
    >
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-6">
        {/* Header Title */}
        <div className="border-b border-slate-100 pb-4 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-xl mb-3 shadow-sm">
            ✏️
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 font-sans leading-tight">Ask Onboarding Query</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mt-1.5">
            Get official verified answers from Mentors &amp; HR Admins
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Question Title */}
          <div className="relative space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <span>Question Summary</span>
              <Sparkles size={12} className="text-blue-500" />
            </label>
            <input
              type="text"
              placeholder="Be specific. e.g., 'What bank accounts are accepted for SalaryHub disbursement?'"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setTitleError(''); }}
              className={`${inputBase} ${titleError ? inputErrorClass : 'border-slate-200'}`}
            />
            {titleError && (
              <p className="text-xs text-red-500 pl-1">{titleError}</p>
            )}

            {/* Similar Questions Dropdown */}
            <AnimatePresence>
              {similarQuestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 top-full mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-lg z-20 space-y-2"
                >
                  <div className="flex items-center gap-1 border-b border-amber-200/50 pb-1.5">
                    <span className="text-xs font-semibold uppercase text-amber-800 tracking-wider">
                      🚨 Matches Found! (Similar Questions):
                    </span>
                  </div>
                  <div className="space-y-2">
                    {similarQuestions.map(q => (
                      <div
                        key={q.id}
                        onClick={() => navigate(`/questions/${q.id}`)}
                        className="p-2.5 bg-white border border-amber-200/50 hover:bg-amber-50/50 rounded-lg cursor-pointer transition-colors shadow-sm"
                      >
                        <h4 className="text-xs font-semibold leading-tight truncate hover:underline text-slate-800">
                          {q.title}
                        </h4>
                        <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5">
                          {q.answers.length} Answers
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Description Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
              <span>Detailed Context</span>
              <FileText size={12} className="text-slate-400" />
            </label>
            <textarea
              rows={5}
              placeholder="Explain the background. List what you have tried, relevant dates, team roles, or HR policies."
              value={description}
              onChange={(e) => { setDescription(e.target.value); setDescriptionError(''); }}
              className={`${inputBase} ${descriptionError ? inputErrorClass : 'border-slate-200'}`}
            />
            {descriptionError && (
              <p className="text-xs text-red-500 pl-1">{descriptionError}</p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Tags (comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. stipend, onboarding, finance, sbi-bank"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className={`${inputBase} border-slate-200`}
            />
            <p className="text-[10px] text-slate-400 font-medium leading-none pl-1 mt-1">
              Add up to 5 keywords to help others find this question.
            </p>
          </div>

          {/* API-level error */}
          {submitError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-xs text-red-600">{submitError}</p>
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors border border-transparent shadow-sm cursor-pointer"
            >
              <Send size={14} />
              <span>Submit Query</span>
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};
export default AskQuestion;