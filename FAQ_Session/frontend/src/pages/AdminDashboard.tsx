import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  HelpCircle, 
  ShieldAlert, 
  Award, 
  Star, 
  Trash2, 
  Flag, 
  AlertOctagon,
  Users,
  ShieldOff,
  Loader2,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { apiService } from '../utils/api';
import { StatusBadge, EmptyState, Skeleton, SkeletonStatsCard, SkeletonCard } from '../components/CommonWidgets';
import { Question } from '../types';

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { 
    questions, 
    faqs,
    promoteToFaq, 
    deleteQuestion, 
    getStats,
    getReportedQueries,
    ignoreQuery,
    warnQuery,
    penalizeQuery,
    deleteReportedQuery
  } = useAppContext();
  const { currentUser, authLoading } = useAuth();
  const { showToast } = useToast();

  const stats = getStats();
  const [reportedQueries, setReportedQueries] = useState<Question[]>([]);
  const [loadingReported, setLoadingReported] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoadingReported(true);
    try {
      const data = await getReportedQueries();
      setReportedQueries(data);
    } catch (err) {
      console.error("Failed to fetch reported queries:", err);
    } finally {
      setLoadingReported(false);
    }
  }, [getReportedQueries]);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchReports();
    }
  }, [currentUser, fetchReports]);

  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [promotingId, setPromotingId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    let active = true;
    (async () => {
      setUsersLoading(true);
      try {
        const data = await apiService.getUsers();
        if (active) {
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        if (active) {
          setUsersLoading(false);
        }
      }
    })();
    return () => { active = false; };
  }, [currentUser]);

  const handleRoleToggle = async (user: any) => {
    const targetId = user._id || user.id;
    const nextRole = user.role === 'admin' ? 'student' : 'admin';

    if (currentUser && (currentUser.id === targetId)) {
      showToast("You can't change your own role.", 'error');
      return;
    }

    setUpdatingUserId(targetId);
    try {
      await apiService.updateUserRole(targetId, nextRole);
      setUsers(prev => prev.map(u => (u._id || u.id) === targetId ? { ...u, role: nextRole } : u));
      showToast(
        nextRole === 'admin'
          ? `${user.name} is now an admin. Their active sessions were revoked.`
          : `${user.name} was demoted to student. Their active sessions were revoked immediately.`,
        'success',
      );
    } catch (err) {
      showToast('Failed to update this user\'s role. Please try again.', 'error');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handlePromoteToFaq = async (questionId: string) => {
    setPromotingId(questionId);
    try {
      await promoteToFaq(questionId);
    } finally {
      setPromotingId(null);
    }
  };


  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SkeletonStatsCard /><SkeletonStatsCard /><SkeletonStatsCard />
        </div>
        <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <EmptyState
          title="Access Restricted 🔐"
          description="Only registered Admin profiles are allowed to access moderation queues."
        />
      </div>
    );
  }

  // Moderation queue: all queries that are not yet resolved (open or answered)
  const openModerationQueue = questions.filter(q => q.status !== 'RESOLVED');

  // Resolved queries: show promote button only if no FAQ linked yet
  const resolvedQueries = questions.filter(q => q.status === 'RESOLVED');

  const handleIgnore = async (id: string) => {
    try {
      await ignoreQuery(id);
      await fetchReports();
    } catch (err: any) {
      alert(err.message || "Failed to ignore reports");
    }
  };

  const handleWarn = async (id: string) => {
    try {
      await warnQuery(id);
      await fetchReports();
    } catch (err: any) {
      alert(err.message || "Failed to warn user");
    }
  };

  const handlePenalize = async (id: string) => {
    try {
      await penalizeQuery(id);
      await fetchReports();
    } catch (err: any) {
      alert(err.message || "Failed to penalize user");
    }
  };

  const handleDeleteReported = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this reported query?")) {
      try {
        await deleteReportedQuery(id);
        await fetchReports();
      } catch (err: any) {
        alert(err.message || "Failed to delete query");
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border border-slate-200 bg-white rounded-2xl shadow-sm text-slate-800 relative overflow-hidden z-10">
        <div className="absolute right-[-10px] top-[-10px] rotate-12 text-slate-100 select-none -z-10">
          <ShieldCheck size={90} />
        </div>
        <div className="flex items-center justify-center w-11 h-11 rounded-lg bg-red-50 text-red-600 text-xl font-bold">🛡️</div>
        <div>
          <h1 className="font-semibold text-xl tracking-tight text-slate-900 font-sans">Admin Panel &amp; Moderation</h1>
          <p className="text-xs font-normal text-slate-500 mt-1">Approve replies, promote resolved queries to FAQ, and manage the knowledge base.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Verified FAQs</p>
          <p className="text-2xl font-semibold text-slate-800 mt-1 font-sans">{stats.totalFAQs}</p>
        </div>
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Open Queries</p>
          <p className="text-2xl font-semibold text-amber-600 mt-1 font-sans">{stats.openQuestions}</p>
        </div>
        <div className="p-5 border border-slate-200 bg-white rounded-xl shadow-sm">
          <p className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">Answered</p>
          <p className="text-2xl font-semibold text-emerald-600 mt-1 font-sans">{stats.answeredQuestions}</p>
        </div>
      </div>

      {/* Moderation Queue — open/answered queries needing reply approval */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
          <HelpCircle size={18} className="text-indigo-500" />
          <span>Moderation Queue ({openModerationQueue.length})</span>
        </h2>
        <p className="text-[11px] text-slate-400 -mt-2 leading-relaxed">
          Open queries waiting for a reply to be approved. Click a query title to review replies and approve one.
        </p>

        {openModerationQueue.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {openModerationQueue.map(q => (
              <div key={q.id} className="p-4 border border-slate-100 bg-slate-50/40 rounded-xl flex flex-col gap-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <StatusBadge status={q.status} />
                  <span className="text-[10px] text-slate-400">{q.answers.length} {q.answers.length === 1 ? 'reply' : 'replies'}</span>
                </div>
                <div>
                  <h3
                    onClick={() => navigate(`/questions/${q.id}`)}
                    className="font-semibold text-sm hover:text-blue-600 cursor-pointer text-slate-800 transition-colors"
                  >
                    {q.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{q.description}</p>
                </div>
                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded transition-colors cursor-pointer"
                      title="Delete query"
                    >
                      <Trash2 size={13} />
                    </button>
                    <span className="text-[10px] text-slate-400 font-medium">
                      By: <span className="font-semibold text-slate-700">{q.author.name}</span>
                    </span>
                  </div>
                  {q.answers.length > 0 && (
                    <button
                      onClick={() => navigate(`/questions/${q.id}`)}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-semibold uppercase transition-colors flex items-center gap-0.5 border border-transparent shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 size={9} /><span>Review &amp; Approve</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
            All queries have been reviewed.
          </div>
        )}
      </div>

      {/* Resolved Queries — promote to FAQ */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
          <Award size={18} className="text-blue-500" />
          <span>Resolved Queries ({resolvedQueries.length})</span>
        </h2>
        <p className="text-[11px] text-slate-400 -mt-2 leading-relaxed">
          Resolved queries have an approved reply. Promote to FAQ to add the answer to the official knowledge base.
        </p>

        {resolvedQueries.length > 0 ? (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {resolvedQueries.map(q => {
              const isPromoted = !!q.linkedFaqId;
              const isPromoting = promotingId === q.id;
              return (
                <div key={q.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span
                      onClick={() => navigate(`/questions/${q.id}`)}
                      className="text-xs font-semibold text-slate-800 hover:text-blue-600 cursor-pointer"
                    >
                      {q.title}
                    </span>
                    {isPromoted && (
                      <p className="text-[10px] text-emerald-600 mt-0.5">Promoted to FAQ</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPromoted ? (
                      <button
                        onClick={() => navigate(`/faqs/${q.linkedFaqId}`)}
                        className="px-2.5 py-1 bg-white text-emerald-700 border border-emerald-200 rounded text-[9px] font-semibold uppercase transition-colors flex items-center gap-0.5 hover:bg-emerald-50 cursor-pointer"
                      >
                        <ExternalLink size={9} /><span>View FAQ</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePromoteToFaq(q.id)}
                        disabled={isPromoting}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-[9px] font-semibold uppercase transition-colors flex items-center gap-0.5 border border-transparent shadow-sm cursor-pointer"
                      >
                        {isPromoting ? <Loader2 size={9} className="animate-spin" /> : <Award size={9} />}
                        <span>{isPromoting ? 'Promoting...' : 'Promote to FAQ'}</span>
                      </button>
                    )}
                    <button
                      onClick={() => deleteQuestion(q.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded transition-colors cursor-pointer"
                      title="Delete query"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
            No resolved queries yet.
          </div>
        )}
      </div>

      {/* Reported Queries Queue */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
          <Flag size={18} className="text-red-500" />
          <span>Reported Queries Queue ({reportedQueries.length})</span>
        </h2>

        {loadingReported ? (
          <div className="text-center py-4 text-xs text-slate-400">Loading reports...</div>
        ) : reportedQueries.length > 0 ? (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {reportedQueries.map((q) => (
              <div
                key={q.id}
                className="p-4 border border-red-100 bg-red-50/10 rounded-xl flex flex-col gap-3 hover:bg-red-50/20 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertOctagon size={10} />
                    Report Count: {q.reportCount}
                  </span>
                </div>

                <div>
                  <h3
                    onClick={() => navigate(`/questions/${q.id}`)}
                    className="font-semibold text-sm hover:text-blue-600 cursor-pointer text-slate-800 transition-colors"
                  >
                    {q.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {q.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 mt-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      By: <span className="font-semibold text-slate-700">{q.author.name}</span>
                      {q.author.warnings && q.author.warnings > 0 ? (
                        <span className="text-red-600 ml-1">({q.author.warnings} warnings)</span>
                      ) : null}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleIgnore(q.id)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[9px] font-semibold uppercase transition-colors border border-slate-200 cursor-pointer"
                    >
                      Ignore
                    </button>
                    <button
                      onClick={() => handleWarn(q.id)}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded text-[9px] font-semibold uppercase transition-colors cursor-pointer"
                    >
                      Warn &amp; Hide
                    </button>
                    <button
                      onClick={() => handlePenalize(q.id)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[9px] font-semibold uppercase transition-colors cursor-pointer"
                    >
                      Penalize
                    </button>
                    <button
                      onClick={() => handleDeleteReported(q.id)}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded text-[9px] font-semibold uppercase transition-colors border border-rose-200 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
            No queries require admin review.
          </div>
        )}
      </div>

      {/* FAQ Management */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
          <ShieldAlert size={18} className="text-rose-500" />
          <span>Manage Verified FAQs ({faqs.length})</span>
        </h2>
        <p className="text-[11px] text-slate-400 -mt-2 leading-relaxed">
          Deleting an FAQ does not delete the source query — it can be re-promoted if needed.
        </p>

        {faqs.length > 0 ? (
          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {faqs.map(q => (
              <div key={q.id} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span
                    onClick={() => navigate(`/faqs/${q.id}`)}
                    className="text-xs font-semibold text-slate-800 hover:text-blue-600 cursor-pointer"
                  >
                    {q.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <Star size={8} className="fill-emerald-600" />Verified
                  </span>
                  <button
                    onClick={() => deleteQuestion(q.id)}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 rounded transition-colors cursor-pointer"
                    title="Delete FAQ"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
            No verified FAQs yet. Promote a resolved query above to create one.
          </div>
        )}
      </div>

      {/* User Management */}
      <div className="p-6 border border-slate-200 bg-white rounded-2xl shadow-sm space-y-4">
        <h2 className="font-semibold text-lg text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3 font-sans">
          <Users size={18} className="text-indigo-500" />
          <span>User Roles ({users.length})</span>
        </h2>
        <p className="text-[11px] text-slate-400 leading-relaxed -mt-2">
          Changing a role revokes that user's active sessions immediately so promotions and demotions take effect right away.
        </p>

        {usersLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ) : users.length > 0 ? (
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {users.map(u => {
              const targetId = u._id || u.id;
              const isSelf = currentUser?.id === targetId;
              const isUpdating = updatingUserId === targetId;
              const isAdminUser = u.role === 'admin';
              return (
                <div key={targetId} className="p-3 border border-slate-100 rounded-lg flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-800 truncate">{u.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold leading-none ${
                        isAdminUser ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {u.role}
                      </span>
                      {isAdminUser && !u.emailVerified && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold leading-none bg-amber-50 text-amber-700 border border-amber-200">
                          Email unverified
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleRoleToggle(u)}
                    disabled={isSelf || isUpdating}
                    title={isSelf ? "You can't change your own role" : isAdminUser ? 'Demote to student' : 'Promote to admin'}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-semibold uppercase transition-colors border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isAdminUser
                        ? 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                        : 'bg-blue-600 text-white border-transparent hover:bg-blue-700'
                    }`}
                  >
                    {isUpdating ? (
                      <Loader2 size={10} className="animate-spin" />
                    ) : isAdminUser ? (
                      <ShieldOff size={10} />
                    ) : (
                      <ShieldCheck size={10} />
                    )}
                    <span>{isAdminUser ? 'Demote' : 'Promote'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-xl bg-slate-50/20">
            No users found.
          </div>
        )}
      </div>
    </motion.div>
  );
};
export default AdminDashboard;
