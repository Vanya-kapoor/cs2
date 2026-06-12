import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { AppProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';

// Pages
import Home from './pages/Home';
import FAQPage from './pages/FAQPage';
import FAQDetailsPage from './pages/FAQDetailsPage';
import QuestionsFeed from './pages/QuestionsFeed';
import AskQuestion from './pages/AskQuestion';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import ResetPasswordPage from './pages/ResetPasswordPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppProvider>
            <Routes>
              {/* Standalone page — no layout chrome */}
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Main app with sidebar/navbar layout */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="faqs" element={<FAQPage />} />
                <Route path="questions" element={<QuestionsFeed />} />
                <Route path="questions/:id" element={<FAQDetailsPage />} />
                <Route path="ask" element={<AskQuestion />} />
                <Route path="profile" element={<Profile />} />
                <Route path="admin" element={<AdminDashboard />} />
              </Route>
            </Routes>
          </AppProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
