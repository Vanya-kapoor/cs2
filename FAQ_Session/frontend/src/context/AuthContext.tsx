import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { apiService } from '../utils/api';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      try {
        const user = await apiService.getCurrentUser();
        if (user) setCurrentUser(user);
      } catch (err) {
        console.error('Failed to sync user:', err);
      } finally {
        setAuthLoading(false);
      }
    };
    syncUser();
  }, []);

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const signIn = async (email: string, password: string) => {
    await apiService.signIn(email, password);
    const user = await apiService.getCurrentUser();
    setCurrentUser(user);
    setIsLoginModalOpen(false);
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
    } catch (err) {
      console.error('Logout failed:', err);
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: currentUser !== null,
        authLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        signIn,
        signUp,
        signInWithGoogle,
        forgotPassword,
        logout,
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
