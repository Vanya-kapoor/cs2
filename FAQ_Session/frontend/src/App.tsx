import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import FAQPage from './pages/FAQPage';
import FAQDetailsPage from './pages/FAQDetailsPage';
import QuestionsFeed from './pages/QuestionsFeed';
import AskQuestion from './pages/AskQuestion';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import NotFoundPage from './pages/NotFoundPage';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <AppProvider>
                <Routes>
                  {/* Standalone pages — no layout chrome */}
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/email-verified" element={<EmailVerifiedPage />} />

                  {/* Main app with sidebar/navbar layout */}
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="faqs" element={<FAQPage />} />
                    <Route path="questions" element={<QuestionsFeed />} />
                    <Route path="questions/:id" element={<FAQDetailsPage />} />
                    <Route path="faqs/:id" element={<FAQDetailsPage />} />
                    <Route path="ask" element={<AskQuestion />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="admin" element={<AdminDashboard />} />
                  </Route>

                  {/* Catch-all 404 */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </AppProvider>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
