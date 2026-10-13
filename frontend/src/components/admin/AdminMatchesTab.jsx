import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X } from 'lucide-react';

/**
 * AdminMatchesTab
 * Responsibility: Displays auto-suggested and confirmed match pairs with compatibility scores and confirm/reject controls.
 */
export const AdminMatchesTab = ({
  matches,
  loading,
  statusFilter,
  onStatusFilterChange,
  onApplyFilter,
  onMatchStatusChange
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Matches Filter Toolbar */}
      <div className="surface-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Match Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="form-input"
          style={{ width: 'auto', height: 38 }}
        >
          <option value="">All Statuses</option>
          <option value="SUGGESTED">Suggested</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button onClick={onApplyFilter} className="btn btn-primary btn-sm" style={{ height: 38 }}>
          Apply Filter
        </button>
      </div>

      {/* Matches List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading system matches...
        </div>
      ) : matches.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          No system matches found matching the criteria.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {matches.map((m) => (
            <div key={m.id} className="surface-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flex: 1, minWidth: 280 }}>
                {/* Lost side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                  <span className="badge badge-lost" style={{ fontSize: '0.7rem' }}>LOST</span>
                  <Link to={`/items/${m.lostItemId}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.lostItemTitle}
                  </Link>
                </div>

                {/* Compatibility Pill */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-blue)', backgroundColor: 'var(--accent-blue-subtle)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)' }}>
                    {m.matchPercentage}%
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.status}</span>
                </div>

                {/* Found side */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1 }}>
                  <span className="badge badge-found" style={{ fontSize: '0.7rem' }}>FOUND</span>
                  <Link to={`/items/${m.foundItemId}`} style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.foundItemTitle}
                  </Link>
                </div>
              </div>

              {/* Admin Match Action Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {m.status !== 'CONFIRMED' && (
                  <button
                    type="button"
                    onClick={() => onMatchStatusChange(m.id, 'CONFIRMED')}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    <Check size={13} /> Confirm
                  </button>
                )}
                {m.status !== 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => onMatchStatusChange(m.id, 'REJECTED')}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                  >
                    <X size={13} /> Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
