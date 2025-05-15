import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Authentication Pages
import Signup from './components/Auth/Signup';
import Login from './components/Auth/Login';
import AdminLogin from './components/Auth/AdminLogin';
import AuthGuard from './components/Auth/AuthGuard';
import Logout from './components/Auth/Logout'; // We'll create this component

// Public Pages
import HomePage from './pages/HomePage';
import FlashcardPage from './pages/FlashcardPage';
import LessonPlayer from './components/LessonPlayer';
import NotFound from './components/Common/NotFound';
import HeartsShop from './pages/HeartsShop';
import ProfilePage from './pages/ProfilePage';
import PracticePage from './pages/PracticePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminLessons from './pages/admin/AdminLessons';
import AdminSigns from './pages/admin/AdminSigns';
import AdminUnits from './pages/admin/AdminUnits';
import AdminAnalytics from './pages/admin/AdminAnalytics';

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/logout" element={<Logout />} />
        
        {/* Public Routes */}
        
        {/* Protected User Routes */}
        <Route path="/Home" element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        } />
        <Route path="/flashcards" element={
          <AuthGuard>
            <FlashcardPage />
          </AuthGuard>
        } />
        <Route path="/lessons/:lessonId" element={
          <AuthGuard>
            <LessonPlayer />
          </AuthGuard>
        } />
        <Route path="/shop/hearts" element={
          <AuthGuard>
            <HeartsShop />
          </AuthGuard>
        } />
        <Route path="/challenge/:challengeId" element={
          <AuthGuard>
            <LessonPlayer />
          </AuthGuard>
        } />
        <Route path="/dashboard" element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        } />
        <Route path="/practice" element={
          <AuthGuard>
            <PracticePage />
          </AuthGuard>
        } />
        <Route path="/profile" element={
          <AuthGuard>
            <ProfilePage />
          </AuthGuard>
        } />
        <Route path="/settings" element={
          <AuthGuard>
            <HomePage />
          </AuthGuard>
        } />

        {/* Admin Routes with admin role check */}
        <Route path="/admin" element={
          <AuthGuard requiredRole="admin">
            <AdminDashboard />
          </AuthGuard>
        } />
        <Route path="/admin/unit" element={
          <AuthGuard requiredRole="admin">
            <AdminUnits />
          </AuthGuard>
        } />
        <Route path="/admin/unit/lessons" element={
          <AuthGuard requiredRole="admin">
            <AdminLessons />
          </AuthGuard>
        } />
        <Route path="/admin/unit/lessons/signs" element={
          <AuthGuard requiredRole="admin">
            <AdminSigns />
          </AuthGuard>
        } />
        <Route path="/admin/analytics" element={<AuthGuard requiredRole="admin"><AdminAnalytics /></AuthGuard>} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;