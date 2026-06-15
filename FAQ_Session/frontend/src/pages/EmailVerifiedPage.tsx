import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, Home } from 'lucide-react';

/**
 * Standalone page — lives at /email-verified
 * better-auth redirects here after a successful email verification
 * (callbackURL is set to /email-verified in auth.config).
 *
 * It also handles the error case where better-auth appends
 * ?error=... to the callbackURL on failure.
 */
const EmailVerifiedPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error');

  // Auto-redirect to home after success
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (error) return;
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [error, navigate]);

  const friendlyError = (code: string | null): string => {
    switch (code) {
      case 'invalid_token':
        return 'The verification link is invalid or has already been used.';
      case 'token_expired':
        return 'The verification link has expired. Please request a new one from your profile.';
      case 'user_not_found':
        return 'We couldn\'t find an account associated with this link.';
      default:
        return 'Email verification failed. The link may have expired or already been used.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        {/* Top accent bar */}
        <div
          className={`h-1 w-full ${
            error
              ? 'bg-gradient-to-r from-red-400 via-rose-500 to-pink-500'
              : 'bg-gradient-to-r from-emerald-400 via-teal-500 to-blue-500'
          }`}
        />

        <div className="p-8 text-center">
          {error ? (
            /* ── Error state ── */
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-red-50 border border-red-100 rounded-full mx-auto mb-5">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Verification Failed</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-6">
                {friendlyError(error)}
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Home size={15} />
                Go to Home
              </button>
            </>
          ) : (
            /* ── Success state ── */
            <>
              <div className="flex items-center justify-center w-16 h-16 bg-emerald-50 border border-emerald-100 rounded-full mx-auto mb-5">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Email Verified!</h2>
              <p className="text-sm text-slate-500 leading-relaxed mb-2">
                Your email address has been successfully verified. You now have full access to all features.
              </p>
              <p className="text-xs text-slate-400 mb-6">
                Redirecting you to the home page in{' '}
                <span className="font-semibold text-slate-600">{countdown}s</span>…
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <Home size={15} />
                Go to Home Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerifiedPage;
