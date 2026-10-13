import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';

export const NotFound = () => {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 1.5rem', maxWidth: 440, margin: '0 auto' }}>
      <div className="surface-card" style={{ padding: '2.5rem 2rem' }}>
        <Compass size={36} color="var(--accent-primary)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
        <h1 style={{ fontSize: '2rem', fontWeight: 600, marginBottom: '0.25rem' }}>404</h1>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 500, color: 'var(--text-secondary)' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '0.5rem 0 1.5rem' }}>
          The page you requested does not exist or has been relocated.
        </p>
        <Link to="/" className="btn btn-primary btn-sm">
          <Home size={14} /> Back to Home
        </Link>
      </div>
    </div>
  );
};
