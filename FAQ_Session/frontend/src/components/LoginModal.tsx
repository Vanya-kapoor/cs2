import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import {
  signInSchema,
  signUpSchema,
  forgotPasswordSchema,
  SignInFormData,
  SignUpFormData,
  ForgotPasswordFormData,
} from '../utils/authSchemas';

type View = 'signin' | 'signup' | 'forgot' | 'forgot-success';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

/* ── Shared field error message ── */
const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? <p className="text-xs text-red-500 mt-1 pl-1">{message}</p> : null;

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, signIn, signUp, signInWithGoogle, forgotPassword, sessionExpiredNotice, dismissSessionExpiredNotice } = useAuth();

  const [view, setView] = useState<View>('signin');
  const [apiError, setApiError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState(''); // keep for success screen

  /* ── Forms ── */
  const signInForm = useForm<SignInFormData>({ resolver: zodResolver(signInSchema) });
  const signUpForm = useForm<SignUpFormData>({ resolver: zodResolver(signUpSchema) });
  const forgotForm = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClose = () => {
    signInForm.reset();
    signUpForm.reset();
    forgotForm.reset();
    setApiError('');
    setView('signin');
    dismissSessionExpiredNotice();
    closeLoginModal();
  };

  const switchView = (v: View) => {
    signInForm.reset();
    signUpForm.reset();
    forgotForm.reset();
    setApiError('');
    setView(v);
  };

  /* ── Submit handlers ── */
  const handleSignIn = signInForm.handleSubmit(async (data) => {
    setApiError('');
    try {
      await signIn(data.email, data.password);
      handleClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Invalid email or password.');
    }
  });

  const handleSignUp = signUpForm.handleSubmit(async (data) => {
    setApiError('');
    try {
      await signUp(data.name, data.email, data.password);
      handleClose();
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Sign up failed. Please try again.');
    }
  });

  const handleForgotPassword = forgotForm.handleSubmit(async (data) => {
    setApiError('');
    try {
      await forgotPassword(data.email);
      setForgotEmail(data.email);
      setView('forgot-success');
    } catch (err: any) {
      setApiError(err?.response?.data?.message || err?.message || 'Failed to send reset email. Try again.');
    }
  });

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setApiError('');
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setApiError(err?.message || 'Google sign-in failed.');
      setGoogleLoading(false);
    }
  };

  const inputBase =
    'w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all';

  const inputError =
    'border-red-300 focus:ring-red-500/30 focus:border-red-400';

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            key={view}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

            <div className="p-6">
              {/* Close */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>

              {/* ── SIGN IN ── */}
              {view === 'signin' && (
                <>
                  {sessionExpiredNotice && (
                    <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs leading-relaxed">
                      Your session is out of date — your account permissions changed. Please sign in again to continue.
                    </div>
                  )}
                  <div className="mb-5">
                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-lg mb-3">🔑</div>
                    <h2 className="text-lg font-bold text-slate-800">Welcome back</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Sign in to your Yaksha account</p>
                  </div>

                  {/* Google */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-all shadow-sm mb-4 disabled:opacity-60"
                  >
                    {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
                    <span>{googleLoading ? 'Redirecting...' : 'Continue with Google'}</span>
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">or</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <form onSubmit={handleSignIn} className="space-y-3" noValidate>
                    {/* Email */}
                    <div>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="Email address"
                          {...signInForm.register('email')}
                          className={`${inputBase} ${signInForm.formState.errors.email ? inputError : ''}`}
                          autoComplete="email"
                        />
                      </div>
                      <FieldError message={signInForm.formState.errors.email?.message} />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password"
                          {...signInForm.register('password')}
                          className={`${inputBase} pr-9 ${signInForm.formState.errors.password ? inputError : ''}`}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <FieldError message={signInForm.formState.errors.password?.message} />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {apiError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{apiError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={signInForm.formState.isSubmitting}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {signInForm.formState.isSubmitting
                        ? <><Loader2 size={15} className="animate-spin" /> Signing in...</>
                        : 'Sign In'}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-500 mt-4">
                    Don't have an account?{' '}
                    <button onClick={() => switchView('signup')} className="text-blue-600 font-semibold hover:underline">
                      Sign up
                    </button>
                  </p>
                </>
              )}

              {/* ── SIGN UP ── */}
              {view === 'signup' && (
                <>
                  <div className="mb-5">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-lg mb-3">🚀</div>
                    <h2 className="text-lg font-bold text-slate-800">Create account</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Join Yaksha and start collaborating</p>
                  </div>

                  {/* Google */}
                  <button
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-all shadow-sm mb-4 disabled:opacity-60"
                  >
                    {googleLoading ? <Loader2 size={16} className="animate-spin" /> : <GoogleIcon />}
                    <span>{googleLoading ? 'Redirecting...' : 'Sign up with Google'}</span>
                  </button>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">or</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <form onSubmit={handleSignUp} className="space-y-3" noValidate>
                    {/* Name */}
                    <div>
                      <div className="relative">
                        <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Full name"
                          {...signUpForm.register('name')}
                          className={`${inputBase} ${signUpForm.formState.errors.name ? inputError : ''}`}
                          autoComplete="name"
                        />
                      </div>
                      <FieldError message={signUpForm.formState.errors.name?.message} />
                    </div>

                    {/* Email */}
                    <div>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="Email address"
                          {...signUpForm.register('email')}
                          className={`${inputBase} ${signUpForm.formState.errors.email ? inputError : ''}`}
                          autoComplete="email"
                        />
                      </div>
                      <FieldError message={signUpForm.formState.errors.email?.message} />
                    </div>

                    {/* Password */}
                    <div>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Password (min 6 characters)"
                          {...signUpForm.register('password')}
                          className={`${inputBase} pr-9 ${signUpForm.formState.errors.password ? inputError : ''}`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <FieldError message={signUpForm.formState.errors.password?.message} />
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <div className="relative">
                        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm password"
                          {...signUpForm.register('confirmPassword')}
                          className={`${inputBase} pr-9 ${signUpForm.formState.errors.confirmPassword ? inputError : ''}`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <FieldError message={signUpForm.formState.errors.confirmPassword?.message} />
                    </div>

                    {apiError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{apiError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={signUpForm.formState.isSubmitting}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {signUpForm.formState.isSubmitting
                        ? <><Loader2 size={15} className="animate-spin" /> Creating account...</>
                        : 'Create Account'}
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-500 mt-4">
                    Already have an account?{' '}
                    <button onClick={() => switchView('signin')} className="text-blue-600 font-semibold hover:underline">
                      Sign in
                    </button>
                  </p>
                </>
              )}

              {/* ── FORGOT PASSWORD ── */}
              {view === 'forgot' && (
                <>
                  <button
                    onClick={() => switchView('signin')}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 mb-4 transition-colors"
                  >
                    <ArrowLeft size={13} /> Back to sign in
                  </button>

                  <div className="mb-5">
                    <div className="w-10 h-10 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-center text-lg mb-3">🔒</div>
                    <h2 className="text-lg font-bold text-slate-800">Reset password</h2>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Enter your email and we'll send you a link to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleForgotPassword} className="space-y-3" noValidate>
                    <div>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          placeholder="Email address"
                          {...forgotForm.register('email')}
                          className={`${inputBase} ${forgotForm.formState.errors.email ? inputError : ''}`}
                          autoComplete="email"
                        />
                      </div>
                      <FieldError message={forgotForm.formState.errors.email?.message} />
                    </div>

                    {apiError && (
                      <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{apiError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={forgotForm.formState.isSubmitting}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {forgotForm.formState.isSubmitting
                        ? <><Loader2 size={15} className="animate-spin" /> Sending...</>
                        : 'Send Reset Link'}
                    </button>
                  </form>
                </>
              )}

              {/* ── FORGOT SUCCESS ── */}
              {view === 'forgot-success' && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-full mx-auto mb-4">
                    <CheckCircle size={28} className="text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-2">Check your inbox</h2>
                  <p className="text-xs text-slate-500 leading-relaxed mb-1">
                    We've sent a password reset link to
                  </p>
                  <p className="text-sm font-semibold text-slate-700 mb-5">{forgotEmail}</p>
                  <p className="text-[11px] text-slate-400 mb-6">
                    The link expires in 1 hour. Check your spam folder if you don't see it.
                  </p>
                  <button
                    onClick={() => switchView('signin')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-semibold rounded-lg transition-colors"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginModal;
