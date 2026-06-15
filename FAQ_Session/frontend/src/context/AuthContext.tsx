import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService, STALE_SESSION_EVENT } from '../utils/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isLoginModalOpen: boolean;
  sessionExpiredNotice: boolean;
  dismissSessionExpiredNotice: () => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  const syncUser = async () => {
    try {
      const user = await apiService.getCurrentUser();
      if (user) setCurrentUser(user);
    } catch {
      // Silently fail — user simply isn't logged in
    }
  };

  useEffect(() => {
    const init = async () => {
      await syncUser();
      setAuthLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    const handleStaleSession = () => {
      apiService.signOut().catch(() => {});
      setCurrentUser(null);
      setSessionExpiredNotice(true);
      setIsLoginModalOpen(true);
    };
    window.addEventListener(STALE_SESSION_EVENT, handleStaleSession);
    return () => window.removeEventListener(STALE_SESSION_EVENT, handleStaleSession);
  }, []);

  const dismissSessionExpiredNotice = () => setSessionExpiredNotice(false);
  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const refreshCurrentUser = async () => {
    await syncUser();
  };

  const signIn = async (email: string, password: string) => {
    await apiService.signIn(email, password);
    const user = await apiService.getCurrentUser();
    setCurrentUser(user);
    setIsLoginModalOpen(false);
    setSessionExpiredNotice(false);
  };

  const signUp = async (name: string, email: string, password: string) => {
    await apiService.signUp(name, email, password);
    await signIn(email, password);
  };

  const signInWithGoogle = async () => {
    try {
      await apiService.signInWithGoogle();
    } catch (err) {
      throw new Error((err as Error).message || 'Google sign-in failed. Please try again.');
    }
  };

  const forgotPassword = async (email: string) => {
    await apiService.forgotPassword(email);
  };

  const logout = async () => {
    try {
      await apiService.signOut();
    } catch {
      // Logout best-effort — clear local state regardless
    }
    setCurrentUser(null);
  };

  const resendVerificationEmail = async () => {
    if (!currentUser?.email) return;
    await apiService.resendVerificationEmail(currentUser.email);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        authLoading,
        isLoginModalOpen,
        sessionExpiredNotice,
        dismissSessionExpiredNotice,
        openLoginModal,
        closeLoginModal,
        signIn,
        signUp,
        signInWithGoogle,
        forgotPassword,
        logout,
        refreshCurrentUser,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
