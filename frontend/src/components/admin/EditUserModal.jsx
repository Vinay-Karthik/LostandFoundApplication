import React from 'react';
import { Edit, X } from 'lucide-react';

/**
 * EditUserModal
 * Responsibility: Modal dialog specifically for modifying an existing user's details, role, status, and password.
 */
export const EditUserModal = ({
  isOpen,
  onClose,
  formData,
  onChange,
  onSubmit,
  loading,
  error
}) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="surface-card" style={{ width: '100%', maxWidth: 480, padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Edit size={20} color="var(--accent-blue)" /> Edit User Account
          </h3>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-lost-bg)', border: '1px solid var(--status-lost-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-lost-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Account Role</label>
              <select
                className="form-input"
                value={formData.role}
                onChange={(e) => onChange({ ...formData, role: e.target.value })}
              >
                <option value="STUDENT">Student</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Account Status</label>
              <select
                className="form-input"
                value={formData.suspended ? 'true' : 'false'}
                onChange={(e) => onChange({ ...formData, suspended: e.target.value === 'true' })}
              >
                <option value="false">Active Access</option>
                <option value="true">Suspended / Banned</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Verification Status</label>
            <select
              className="form-input"
              value={formData.verified ? 'true' : 'false'}
              onChange={(e) => onChange({ ...formData, verified: e.target.value === 'true' })}
            >
              <option value="true">Verified Student</option>
              <option value="false">Pending Verification</option>
            </select>
          </div>

          <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
            <label className="form-label">Reset Password (Optional)</label>
            <input
              type="password"
              className="form-input"
              placeholder="Leave blank to keep existing password"
              value={formData.newPassword}
              onChange={(e) => onChange({ ...formData, newPassword: e.target.value })}
              minLength={6}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Enter a new password (min 6 characters) if you need to reset this user's password.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="btn btn-primary btn-sm"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
