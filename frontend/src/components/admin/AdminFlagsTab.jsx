import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Eye, Check, Trash2 } from 'lucide-react';

/**
 * AdminFlagsTab
 * Responsibility: Displays campus flagged listings moderation queue with dismiss or remove actions.
 */
export const AdminFlagsTab = ({
  flags,
  loading,
  onResolveFlag
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading moderation reports...
        </div>
      ) : flags.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <ShieldCheck size={36} color="var(--accent-blue)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '0.35rem' }}>No Flagged Reports</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
            All user listings are clean and in compliance with campus guidelines.
          </p>
        </div>
      ) : (
        flags.map((flag) => (
          <div
            key={flag.id}
            className="surface-card"
            style={{
              padding: '1.25rem 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              borderLeft: '4px solid var(--status-lost-border)',
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={15} color="var(--status-lost-text)" />
                <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {flag.itemTitle}
                </span>
                <span className={`badge ${flag.itemType === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                  {flag.itemType}
                </span>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                Reported by: <strong style={{ color: 'var(--text-primary)' }}>{flag.reportedByName}</strong>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--status-lost-text)', backgroundColor: 'var(--status-lost-bg)', padding: '0.35rem 0.6rem', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}>
                Reason: {flag.reason}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link
                to={`/items/${flag.itemId}`}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.85rem' }}
              >
                <Eye size={14} /> Review Item
              </Link>

              <button
                type="button"
                onClick={() => onResolveFlag(flag.id, false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.4rem 0.85rem' }}
              >
                <Check size={14} /> Dismiss Flag
              </button>

              <button
                type="button"
                onClick={() => onResolveFlag(flag.id, true)}
                className="btn btn-coral btn-sm"
                style={{ padding: '0.4rem 0.85rem' }}
              >
                <Trash2 size={14} /> Remove Item
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
