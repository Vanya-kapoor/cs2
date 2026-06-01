import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MockDbProvider } from './context/MockDbContext';
import MainLayout from './layouts/MainLayout';

// Pages
import Home from './pages/Home';
import FAQPage from './pages/FAQPage';
import FAQDetailsPage from './pages/FAQDetailsPage';
import QuestionsFeed from './pages/QuestionsFeed';
import AskQuestion from './pages/AskQuestion';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import { Categories, Trending, Bookmarks, MyQuestions } from './pages/HelperPages';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MockDbProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="faqs" element={<FAQPage />} />
              <Route path="questions" element={<QuestionsFeed />} />
              <Route path="questions/:id" element={<FAQDetailsPage />} />
              <Route path="ask" element={<AskQuestion />} />
              <Route path="categories" element={<Categories />} />
              <Route path="trending" element={<Trending />} />
              <Route path="bookmarks" element={<Bookmarks />} />
              <Route path="my-questions" element={<MyQuestions />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </MockDbProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
