import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useWebSocket } from '../context/WebSocketContext';
import { messageApi } from '../api/messageApi';
import { 
  Compass, Plus, Bell, X, Moon, Sun 
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { incomingMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationToast, setNotificationToast] = useState(null);

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

    const handleMessagesRead = () => {
      fetchUnreadCount();
      setNotificationToast(null);
    };

    const handleUnreadUpdated = () => {
      fetchUnreadCount();
    };

    window.addEventListener('messages-read', handleMessagesRead);
    window.addEventListener('unread-updated', handleUnreadUpdated);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchUnreadCount();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        fetchUnreadCount();
      }
    }, 6000);

    return () => {
      window.removeEventListener('messages-read', handleMessagesRead);
      window.removeEventListener('unread-updated', handleUnreadUpdated);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [isAuthenticated, location.pathname]);

  // Handle incoming real-time notifications
  useEffect(() => {
    if (incomingMessage && isAuthenticated) {
      if (incomingMessage.receiverId === user?.id) {
        setUnreadCount((prev) => prev + 1);

        if (!location.pathname.startsWith('/messages')) {
          setNotificationToast({
            senderId: incomingMessage.senderId,
            senderName: incomingMessage.senderName,
            content: incomingMessage.content,
          });

          const timer = setTimeout(() => {
            setNotificationToast(null);
          }, 6000);
          return () => clearTimeout(timer);
        } else {
          setNotificationToast(null);
        }
      }
    }
  }, [incomingMessage, isAuthenticated, location.pathname, user?.id]);

  // If unauthenticated: Screen 1 Landing Topbar
  if (!isAuthenticated) {
    return (
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0.9rem 2rem',
        transition: 'background-color var(--transition), border-color var(--transition)',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}>
              <Compass size={18} strokeWidth={2.4} />
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Campus<span style={{ color: 'var(--accent-blue)' }}>Lost&Found</span>
            </span>
          </Link>

          {/* Center Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem', fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            <Link to="/" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Home</Link>
            <Link to="/items">Browse Items</Link>
            <Link to="/#about">About</Link>
            <Link to="/#contact">Contact</Link>
          </nav>

          {/* Right Controls: Theme Toggle & Login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={toggleTheme}
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <Link 
              to="/login" 
              className="btn btn-coral"
              style={{ borderRadius: 'var(--radius-full)', padding: '0.5rem 1.5rem' }}
            >
              Login
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // If authenticated: Top action bar inside the dashboard
  return (
    <>
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem 0',
        maxWidth: 1200,
        margin: '0 auto',
        width: '100%',
      }}>
        {/* Left: Subtle Campus Breadcrumb/Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Campus<span style={{ color: 'var(--accent-blue)' }}>Track</span>
          </span>
          <span style={{ color: 'var(--border-subtle)' }}>/</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
            {location.pathname === '/' ? 'Dashboard' : location.pathname.replace('/', '').replace('-', ' ')}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link 
            to="/post" 
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-md)', padding: '0.55rem 1.15rem' }}
          >
            <Plus size={16} strokeWidth={2.4} /> Report Item
          </Link>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              transition: 'var(--theme-transition)',
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun size={18} style={{ transform: 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
            ) : (
              <Moon size={18} style={{ transform: 'rotate(0deg)', transition: 'transform 0.3s ease' }} />
            )}
          </button>

          {/* Notification Bell */}
          <Link 
            to="/messages"
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              position: 'relative',
              transition: 'var(--theme-transition)',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 4,
                right: 4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: 'var(--accent-coral)',
              }} />
            )}
          </Link>

          {/* User Profile Avatar */}
          <Link 
            to="/profile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-blue-subtle)',
              border: '2px solid var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--accent-blue)',
              fontSize: '0.95rem',
              overflow: 'hidden',
            }}>
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {notificationToast && (
        <div 
          className="surface-card"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            maxWidth: 340,
            width: '90%',
            padding: '1rem',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-start',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--accent-blue-subtle)',
            color: 'var(--accent-blue)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bell size={16} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {notificationToast.senderName}
              </div>
              <button 
                onClick={() => setNotificationToast(null)}
                style={{ color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
            <div style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              marginTop: '0.15rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {notificationToast.content}
            </div>
            <button
              onClick={() => {
                navigate(`/messages?userId=${notificationToast.senderId}`);
                setNotificationToast(null);
              }}
              className="btn btn-primary btn-sm"
              style={{ marginTop: '0.5rem', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              Reply →
            </button>
          </div>
        </div>
      )}
    </>
  );
};
