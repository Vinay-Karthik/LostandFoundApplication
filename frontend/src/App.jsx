import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Home } from './pages/Home';
import { BrowseItems } from './pages/BrowseItems';
import { ItemDetail } from './pages/ItemDetail';
import { PostItem } from './pages/PostItem';
import { MyItems } from './pages/MyItems';
import { MatchesPage } from './pages/MatchesPage';
import { MessagesPage } from './pages/MessagesPage';
import { Profile } from './pages/Profile';
import { BookmarksPage } from './pages/BookmarksPage';
import { AdminPortal } from './pages/AdminPortal';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NotFound } from './pages/NotFound';

const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  if (isAuthRoute) {
    return (
      <main style={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    );
  }

  // If authenticated: Sidebar + Top Header + Content
  if (isAuthenticated) {
    return (
      <div className="authenticated-layout">
        <Sidebar />
        <div className="content-wrapper">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/items" element={<BrowseItems />} />
              <Route path="/items/:id" element={<ItemDetail />} />
              <Route path="/post" element={<ProtectedRoute><PostItem /></ProtectedRoute>} />
              <Route path="/my-items" element={<ProtectedRoute><MyItems /></ProtectedRoute>} />
              <Route path="/matches" element={<ProtectedRoute><MatchesPage /></ProtectedRoute>} />
              <Route path="/bookmarks" element={<ProtectedRoute><BookmarksPage /></ProtectedRoute>} />
              <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminPortal /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  // If unauthenticated: Landing page layout with top navigation & footer
  return (
    <div className="app-container" style={{ flexDirection: 'column' }}>
      <Navbar />
      <main className="main-content" style={{ maxWidth: '100%', padding: 0 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/items" element={<div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}><BrowseItems /></div>} />
          <Route path="/items/:id" element={<div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}><ItemDetail /></div>} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
