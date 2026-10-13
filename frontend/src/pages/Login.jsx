import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, School } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      backgroundColor: 'var(--bg-primary)',
    }}>
      <div className="surface-card" style={{
        maxWidth: 820,
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1.1fr',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}>
        {/* Left Side: Royal Blue Sidebar (Screen 2) */}
        <div style={{
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          padding: '3rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '2rem',
            }}>
              <Compass size={24} color="#FFFFFF" />
              <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>CampusLost&Found</span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.2, color: '#FFFFFF' }}>
              Welcome Back! 👋
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.925rem', marginTop: '0.5rem' }}>
              Sign in to continue to CampusLost&Found
            </p>
          </div>

          {/* Campus Building Graphic */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: 0.85,
            marginTop: '2rem',
          }}>
            <School size={80} strokeWidth={1.5} color="#FFFFFF" />
          </div>
        </div>

        {/* Right Side: Clean Sign In Form (Screen 2) */}
        <div style={{ padding: '2.5rem 2rem', backgroundColor: 'var(--bg-surface)' }}>
          {/* Segmented Top Tabs */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-subtle)',
            marginBottom: '1.75rem',
          }}>
            <button
              style={{
                flex: 1,
                paddingBottom: '0.65rem',
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'var(--accent-blue)',
                borderBottom: '2px solid var(--accent-blue)',
                marginBottom: '-2px',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              style={{
                flex: 1,
                paddingBottom: '0.65rem',
                fontWeight: 600,
                fontSize: '0.95rem',
                color: 'var(--text-muted)',
              }}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div style={{
              padding: '0.65rem 0.85rem',
              backgroundColor: 'var(--status-lost-bg)',
              border: '1px solid var(--status-lost-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--status-lost-text)',
              fontSize: '0.8125rem',
              marginBottom: '1.25rem',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">University Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="your@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', cursor: 'pointer' }}>
                  Forgot Password?
                </span>
              </div>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.85rem 0 1.25rem' }}>
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: 'var(--accent-blue)', width: 16, height: 16, cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Remember me
              </label>
            </div>

            {/* Coral Primary Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-coral"
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Social Divider */}
          <div style={{
            position: 'relative',
            textAlign: 'center',
            margin: '1.5rem 0 1rem',
          }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)' }} />
            </div>
            <span style={{ position: 'relative', backgroundColor: 'var(--bg-surface)', padding: '0 0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              or continue with
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => alert('Campus single sign-on is active. Please use your campus email.')}
            >
              Google
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => alert('Campus single sign-on is active. Please use your campus email.')}
            >
              Microsoft
            </button>
          </div>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
