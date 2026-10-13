import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { itemApi } from '../api/itemApi';
import { matchApi } from '../api/matchApi';
import { 
  User, Mail, ShieldCheck, Clock, 
  KeyRound, Edit3, Save, Package, Sparkles, MessageSquare, CheckCircle2,
  Camera, UploadCloud, Trash2, Loader2
} from 'lucide-react';
import { format } from 'date-fns';

export const Profile = () => {
  const { user, isVerified, isAdmin, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [stats, setStats] = useState({ itemsCount: 0, matchesCount: 0, resolvedCount: 0 });

  // Avatar upload state
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    authApi.getMe()
      .then((res) => {
        if (res.success && res.data) {
          setProfileData(res.data);
          setNameInput(res.data.name);
          updateUser(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    Promise.all([
      itemApi.getMyItems(),
      matchApi.getMyMatches(),
    ]).then(([itemsRes, matchRes]) => {
      const myItems = itemsRes.data || [];
      const resolved = myItems.filter(i => i.status === 'RESOLVED').length;
      setStats({
        itemsCount: myItems.length,
        matchesCount: matchRes.data?.length || 0,
        resolvedCount: resolved,
      });
    }).catch(console.error);
  }, []);

  const handleAvatarFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file (PNG, JPG, WEBP)');
      setTimeout(() => setAvatarError(''), 4000);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAvatarError('Image file size must be less than 10MB');
      setTimeout(() => setAvatarError(''), 4000);
      return;
    }

    setAvatarUploading(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await authApi.uploadAvatar(formData);
      if (res.success && res.data) {
        setProfileData(res.data);
        updateUser(res.data);
        setAvatarSuccess('Profile photo updated successfully!');
        setTimeout(() => setAvatarSuccess(''), 4000);
      }
    } catch (err) {
      setAvatarError(err.message || 'Failed to upload image. Please try again.');
      setTimeout(() => setAvatarError(''), 5000);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;

    setAvatarUploading(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const res = await authApi.updateProfile({ name: profileData.name, avatarUrl: '' });
      if (res.success && res.data) {
        setProfileData(res.data);
        updateUser(res.data);
        setAvatarSuccess('Profile photo removed.');
        setTimeout(() => setAvatarSuccess(''), 4000);
      }
    } catch (err) {
      setAvatarError(err.message || 'Failed to remove photo.');
      setTimeout(() => setAvatarError(''), 4000);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setNameSaving(true);
    setNameError('');
    setNameSuccess('');

    try {
      const res = await authApi.updateProfile({ name: nameInput.trim() });
      if (res.success && res.data) {
        setProfileData(res.data);
        updateUser(res.data);
        setIsEditing(false);
        setNameSuccess('Profile updated successfully!');
        setTimeout(() => setNameSuccess(''), 4000);
      }
    } catch (err) {
      setNameError(err.message || 'Failed to update profile');
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    setPasswordSaving(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setPasswordSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top 2 Cards: Student Avatar Card & Account Information Card (Screen 9) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 340px) 1fr', gap: '1.5rem' }}>
        
        {/* Left Profile Card (Screen 9) */}
        <div className="surface-card" style={{ padding: '2rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
          {/* Avatar with Upload Feature */}
          <div style={{ position: 'relative', width: 104, height: 104, margin: '0 auto 1.25rem' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              title="Click to upload profile photo"
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-blue-subtle)',
                border: '3px solid var(--accent-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.4rem',
                fontWeight: 800,
                color: 'var(--accent-blue)',
                overflow: 'hidden',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
              }}
            >
              {profileData?.avatarUrl ? (
                <img
                  src={profileData.avatarUrl}
                  alt={profileData.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span>{profileData?.name ? profileData.name.charAt(0).toUpperCase() : 'U'}</span>
              )}

              {/* Uploading Overlay Spinner */}
              {avatarUploading && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-full)',
                  zIndex: 2,
                }}>
                  <Loader2 size={24} className="spin-animation" />
                </div>
              )}
            </div>

            {/* Camera Badge Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-blue)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--bg-surface)',
                boxShadow: 'var(--shadow-md)',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
              }}
              title="Upload new profile picture"
            >
              <Camera size={15} strokeWidth={2.4} />
            </button>

            {/* Hidden Native File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileSelect}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              style={{ display: 'none' }}
            />
          </div>

          {/* Upload Status / Alerts */}
          {avatarSuccess && (
            <div style={{
              padding: '0.4rem 0.6rem',
              backgroundColor: 'var(--status-found-bg)',
              border: '1px solid var(--status-found-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--status-found-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginBottom: '0.85rem',
            }}>
              {avatarSuccess}
            </div>
          )}

          {avatarError && (
            <div style={{
              padding: '0.4rem 0.6rem',
              backgroundColor: 'var(--status-lost-bg)',
              border: '1px solid var(--status-lost-border)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--status-lost-text)',
              fontSize: '0.75rem',
              fontWeight: 600,
              marginBottom: '0.85rem',
            }}>
              {avatarError}
            </div>
          )}

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {profileData?.name}
          </h2>

          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {profileData?.email}
          </p>

          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Campus Member • Verified Student
          </div>

          {profileData?.avatarUrl && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '0.75rem' }}>
              <button
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
                className="btn btn-ghost btn-sm"
                style={{ fontSize: '0.75rem', color: 'var(--status-lost-text)', padding: '0.25rem 0.6rem' }}
                title="Remove photo"
              >
                <Trash2 size={13} /> Remove Photo
              </button>
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '1.25rem', paddingTop: '1rem' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-coral btn-sm"
              style={{ width: '100%', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius-md)' }}
            >
              <Edit3 size={14} /> {isEditing ? 'Cancel Edit' : 'Edit Profile Name'}
            </button>
          </div>
        </div>

        {/* Right Account Information Card (Screen 9) */}
        <div className="surface-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
            Account Information
          </h3>

          {nameSuccess && (
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-found-bg)', border: '1px solid var(--status-found-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-found-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {nameSuccess}
            </div>
          )}

          {nameError && (
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-lost-bg)', border: '1px solid var(--status-lost-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-lost-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              {nameError}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" disabled={nameSaving} className="btn btn-primary btn-sm">
                  <Save size={14} /> Save Changes
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', fontSize: '0.875rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>FULL NAME</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {profileData?.name}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>UNIVERSITY EMAIL</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {profileData?.email}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>ACCOUNT SCOPE</div>
                <div style={{ fontWeight: 700, color: '#16A34A', marginTop: '0.2rem' }}>
                  ● {profileData?.role} ({isVerified ? 'Verified' : 'Pending'})
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>MEMBER SINCE</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {profileData?.createdAt ? format(new Date(profileData.createdAt), 'MMMM yyyy') : 'Recent'}
                </div>
              </div>
            </div>
          )}

          {/* Password Section */}
          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
              Change Password
            </h4>

            {passwordSuccess && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-found-bg)', border: '1px solid var(--status-found-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-found-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-lost-bg)', border: '1px solid var(--status-lost-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-lost-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <input
                type="password"
                className="form-input"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="form-input"
                placeholder="New password (min 6)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <input
                type="password"
                className="form-input"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn btn-secondary btn-sm"
                style={{ height: 38 }}
              >
                {passwordSaving ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Quick Stats Row (Screen 9: 4 Cards) */}
      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
          Quick Stats
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {/* Card 1: Posts */}
          <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>
              {stats.itemsCount}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.15rem' }}>
              Posts
            </div>
          </div>

          {/* Card 2: Messages */}
          <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-coral)' }}>
              {stats.matchesCount}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.15rem' }}>
              Matches
            </div>
          </div>

          {/* Card 3: Items Recovered */}
          <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A' }}>
              {stats.resolvedCount}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.15rem' }}>
              Items Recovered
            </div>
          </div>

          {/* Card 4: Days Active */}
          <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
              12
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.15rem' }}>
              Days Active
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
