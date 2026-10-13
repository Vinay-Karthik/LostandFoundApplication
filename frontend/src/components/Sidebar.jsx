import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import { messageApi } from '../api/messageApi';
import { 
  Home, Search, Package, MessageSquare, Sparkles, 
  User, ShieldCheck, LogOut, Compass, Moon, Sun, Bookmark, X 
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { incomingMessage } = useWebSocket();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = () => {
    if (isAuthenticated) {
      messageApi.getUnreadCount()
        .then((res) => {
          if (res.success && typeof res.data === 'number') {
            setUnreadCount(res.data);
          }
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const handleMessagesRead = () => fetchUnreadCount();
    const handleUnreadUpdated = () => fetchUnreadCount();

    window.addEventListener('messages-read', handleMessagesRead);
    window.addEventListener('unread-updated', handleUnreadUpdated);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        fetchUnreadCount();
      }
    }, 6000);

    return () => {
      window.removeEventListener('messages-read', handleMessagesRead);
      window.removeEventListener('unread-updated', handleUnreadUpdated);
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  return (
    <>
      {isOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={onClose} 
          aria-hidden="true" 
        />
      )}
      <aside className={`sidebar-nav ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <Link to="/" className="sidebar-brand" onClick={onClose} style={{ padding: '0.4rem 0' }}>
            <div className="sidebar-brand-icon">
              <Compass size={18} strokeWidth={2.4} />
            </div>
            <span className="sidebar-brand-name">
              Campus<span style={{ color: 'var(--accent-blue)' }}>Lost&Found</span>
            </span>
          </Link>
          <button 
            type="button"
            className="mobile-close-btn" 
            onClick={onClose}
            aria-label="Close sidebar menu"
            style={{
              padding: '0.35rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-menu">
          <NavLink 
            to="/" 
            end
            onClick={onClose}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Home</span>
        </NavLink>

        <NavLink 
          to="/items" 
          onClick={onClose}
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <Search size={18} />
          <span>Lost & Found</span>
        </NavLink>

        <NavLink 
          to="/my-items" 
          onClick={onClose}
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <Package size={18} />
          <span>My Posts</span>
        </NavLink>

        <NavLink 
          to="/messages" 
          onClick={onClose}
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <MessageSquare size={18} />
          <span>Messages</span>
          {unreadCount > 0 && (
            <span style={{
              marginLeft: 'auto',
              backgroundColor: 'var(--accent-coral)',
              color: '#FFFFFF',
              fontSize: '0.7rem',
              fontWeight: 700,
              padding: '0.1rem 0.4rem',
              borderRadius: 'var(--radius-full)',
            }}>
              {unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink 
          to="/matches" 
          onClick={onClose}
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <Sparkles size={18} />
          <span>Matches</span>
        </NavLink>

        <NavLink 
          to="/bookmarks" 
          onClick={onClose}
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <Bookmark size={18} />
          <span>Bookmarks</span>
        </NavLink>

        <NavLink 
          to="/profile" 
          onClick={onClose}
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
        >
          <User size={18} />
          <span>Profile</span>
        </NavLink>

        {isAdmin && (
          <NavLink 
            to="/admin" 
            onClick={onClose}
            className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          >
            <ShieldCheck size={18} />
            <span>Admin Portal</span>
          </NavLink>
        )}
      </nav>

      {/* Footer / Theme Toggle & Logout */}
      <div className="sidebar-footer">
        <button
          onClick={toggleTheme}
          className="sidebar-item"
          style={{ width: '100%', color: 'var(--text-secondary)' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="sidebar-item"
          style={{ width: '100%', color: 'var(--text-secondary)' }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
    </>
  );
};
