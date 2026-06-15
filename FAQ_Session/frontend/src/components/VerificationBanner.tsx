import React, { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

/**
 * Persistent warning banner shown when the signed-in user has the admin
 * role but hasn't verified their email yet (e.g. they were just promoted to
 * admin). Admin-only endpoints reject requests from unverified admins with
 * `EMAIL_VERIFICATION_REQUIRED`, so this banner stays visible until the user
 * verifies, reminding them why admin actions are failing.
 */
export const VerificationBanner: React.FC = () => {
  const { currentUser, resendVerificationEmail } = useAuth();
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  if (!currentUser || currentUser.role !== 'ADMIN' || currentUser.emailVerified) {
    return null;
  }

  const handleResend = async () => {
    setStatus('sending');
    try {
      await resendVerificationEmail();
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="mb-4 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-2.5">
        <AlertTriangle size={16} className="text-amber-500 flex-shrink-0" />
        <p className="text-xs font-medium leading-relaxed">
          Your account was promoted to <span className="font-semibold">Admin</span>, but your email isn't verified yet.
          Verify your email to unlock admin actions (approving replies, managing FAQs, etc).
        </p>
      </div>
      <button
        onClick={handleResend}
        disabled={status === 'sending' || status === 'sent'}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase rounded-lg border border-amber-300 bg-white text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-60 flex-shrink-0 cursor-pointer"
      >
        {status === 'sending' && <Loader2 size={12} className="animate-spin" />}
        {status === 'sent' && <CheckCircle2 size={12} />}
        {status === 'idle' && 'Resend verification email'}
        {status === 'sending' && 'Sending...'}
        {status === 'sent' && 'Email sent'}
        {status === 'error' && 'Try again'}
      </button>
    </div>
  );
};

export default VerificationBanner;
