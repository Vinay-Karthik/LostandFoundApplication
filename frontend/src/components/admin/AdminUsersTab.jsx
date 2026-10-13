import React from 'react';
import { Search, UserPlus, Eye, Edit, Ban, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

/**
 * AdminUsersTab
 * Responsibility: Displays campus user list with search, filtering, and administration control buttons.
 */
export const AdminUsersTab = ({
  users,
  loading,
  search,
  onSearchChange,
  roleFilter,
  onRoleFilterChange,
  verifiedFilter,
  onVerifiedFilterChange,
  onSearchSubmit,
  onAddUser,
  onInspectUser,
  onEditUser,
  onToggleSuspension,
  onToggleVerification,
  onDeleteUser
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* User Actions & Filters Toolbar */}
      <div className="surface-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-elevated)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearchSubmit()}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => onRoleFilterChange(e.target.value)}
          className="form-input"
          style={{ width: 'auto', height: 38 }}
        >
          <option value="">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={verifiedFilter}
          onChange={(e) => onVerifiedFilterChange(e.target.value)}
          className="form-input"
          style={{ width: 'auto', height: 38 }}
        >
          <option value="">All Verification</option>
          <option value="true">Verified Only</option>
          <option value="false">Pending Verification</option>
        </select>

        <button onClick={onSearchSubmit} className="btn btn-secondary btn-sm" style={{ height: 38 }}>
          Search
        </button>

        <button 
          onClick={onAddUser} 
          className="btn btn-primary btn-sm"
          style={{ height: 38, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <UserPlus size={15} /> Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="surface-card" style={{ padding: '0', overflowX: 'auto', backgroundColor: 'var(--bg-surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.85rem 1rem' }}>User Profile</th>
              <th style={{ padding: '0.85rem 1rem' }}>University Email</th>
              <th style={{ padding: '0.85rem 1rem' }}>Role</th>
              <th style={{ padding: '0.85rem 1rem' }}>Account Status</th>
              <th style={{ padding: '0.85rem 1rem' }}>Verification</th>
              <th style={{ padding: '0.85rem 1rem' }}>Joined</th>
              <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Admin Controls</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading campus users from database...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No matching users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: u.suspended ? 0.75 : 1 }}>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{
                        width: 34,
                        height: 34,
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--accent-blue-subtle)',
                        color: 'var(--accent-blue)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}>
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          u.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ID: #{u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: u.role === 'ADMIN' ? 'rgba(37, 99, 235, 0.15)' : 'var(--bg-elevated)',
                      color: u.role === 'ADMIN' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: u.suspended ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: u.suspended ? 'var(--status-lost-text)' : '#16A34A',
                    }}>
                      {u.suspended ? 'SUSPENDED' : 'ACTIVE'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span style={{
                      padding: '0.2rem 0.5rem',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      backgroundColor: u.verified ? 'var(--status-found-bg)' : 'var(--status-lost-bg)',
                      color: u.verified ? 'var(--status-found-text)' : 'var(--status-lost-text)',
                    }}>
                      {u.verified ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'Recent'}
                  </td>
                  <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => onInspectUser(u.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                        title="Inspect user activity & items"
                      >
                        <Eye size={13} /> Inspect
                      </button>

                      <button
                        onClick={() => onEditUser(u)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                        title="Edit user details"
                      >
                        <Edit size={13} /> Edit
                      </button>

                      <button
                        onClick={() => onToggleSuspension(u.id, !u.suspended)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: u.suspended ? '#16A34A' : 'var(--status-lost-text)' }}
                        title={u.suspended ? 'Unsuspend user' : 'Suspend / Ban user'}
                      >
                        <Ban size={13} /> {u.suspended ? 'Unsuspend' : 'Suspend'}
                      </button>

                      <button
                        onClick={() => onToggleVerification(u.id, !u.verified)}
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                        title={u.verified ? 'Revoke verification' : 'Verify student'}
                      >
                        {u.verified ? 'Unverify' : 'Verify'}
                      </button>

                      <button
                        onClick={() => onDeleteUser(u.id, u.email)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--status-lost-text)', padding: '0.25rem 0.4rem' }}
                        title="Delete user"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
