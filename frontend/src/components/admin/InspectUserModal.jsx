import React from 'react';
import { Link } from 'react-router-dom';
import { User, X, Trash2, Ban, Edit, Eye } from 'lucide-react';
import { format } from 'date-fns';

/**
 * InspectUserModal
 * Responsibility: Modal dialog displaying a student's profile dossier, engagement statistics, and posted listings.
 */
export const InspectUserModal = ({
  isOpen,
  onClose,
  userData,
  loading,
  onDeleteItem,
  onDeleteUser,
  onToggleSuspension,
  onOpenEdit
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="surface-card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--accent-blue)" /> Student Profile & Activity Dossier
          </h3>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {loading || !userData ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading user data and campus activity...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* User Header Profile Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', backgroundColor: 'var(--bg-elevated)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-blue-subtle)',
                color: 'var(--accent-blue)',
                fontSize: '1.5rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
              }}>
                {userData.user.avatarUrl ? (
                  <img src={userData.user.avatarUrl} alt={userData.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  userData.user.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {userData.user.name}
                  </h4>
                  <span className={`badge ${userData.user.role === 'ADMIN' ? 'badge-matched' : 'badge-found'}`}>
                    {userData.user.role}
                  </span>
                  <span style={{
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    backgroundColor: userData.user.suspended ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                    color: userData.user.suspended ? 'var(--status-lost-text)' : '#16A34A',
                  }}>
                    {userData.user.suspended ? 'SUSPENDED' : 'ACTIVE'}
                  </span>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {userData.user.email} • ID #{userData.user.id}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Joined: {userData.user.createdAt ? format(new Date(userData.user.createdAt), 'MMMM dd, yyyy') : 'Recent'}
                </div>
              </div>
            </div>

            {/* Activity Stats Counter */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{userData.totalItems}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Items</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-lost-text)' }}>{userData.lostCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lost Reports</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16A34A' }}>{userData.foundCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Found Items</div>
              </div>
              <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>{userData.resolvedCount}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Resolved</div>
              </div>
            </div>

            {/* Items Posted By User */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                Posted Listings ({userData.items.length})
              </h4>

              {userData.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                  This user has not posted any items yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                  {userData.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.85rem', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span className={`badge ${item.type === 'LOST' ? 'badge-lost' : 'badge-found'}`} style={{ fontSize: '0.65rem' }}>
                          {item.type}
                        </span>
                        <Link to={`/items/${item.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {item.title}
                        </Link>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({item.status})</span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Link to={`/items/${item.id}`} className="btn btn-ghost btn-sm" style={{ padding: '0.2rem 0.4rem' }}>
                          <Eye size={12} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDeleteItem(item.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--status-lost-text)', padding: '0.2rem 0.4rem' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons inside Dossier */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => onDeleteUser(userData.user.id, userData.user.email)}
                className="btn btn-ghost btn-sm"
                style={{ color: 'var(--status-lost-text)' }}
              >
                <Trash2 size={14} /> Delete Account
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => onToggleSuspension(userData.user.id, !userData.user.suspended)}
                  className="btn btn-secondary btn-sm"
                >
                  <Ban size={14} /> {userData.user.suspended ? 'Unsuspend Account' : 'Suspend Account'}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenEdit(userData.user)}
                  className="btn btn-primary btn-sm"
                >
                  <Edit size={14} /> Edit Full Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
