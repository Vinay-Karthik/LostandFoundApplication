import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import { itemApi } from '../api/itemApi';
import { matchApi } from '../api/matchApi';
import { messageApi } from '../api/messageApi';
import { 
  User, Mail, ShieldCheck, Clock, 
  KeyRound, Edit3, Save, Package, Sparkles, MessageSquare, CheckCircle2,
  Camera, UploadCloud, Trash2, Loader2, Eye, EyeOff, LogOut, Bell,
  Calendar, Check, AlertCircle, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

export const Profile = () => {
  const { user, isVerified, isAdmin, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileData, setProfileData] = useState(user || null);
  const [loading, setLoading] = useState(!user);
  const [stats, setStats] = useState({ itemsCount: 0, matchesCount: 0, resolvedCount: 0 });
  const [unreadCount, setUnreadCount] = useState(0);

  // Avatar upload & preview state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarSuccess, setAvatarSuccess] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || '');
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password state & visibility toggles
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      messageApi.getUnreadCount().catch(() => ({ data: { count: 0 } })),
    ]).then(([itemsRes, matchRes, unreadRes]) => {
      const myItems = itemsRes.data || [];
      const resolved = myItems.filter(i => i.status === 'RESOLVED').length;
      setStats({
        itemsCount: myItems.length,
        matchesCount: matchRes.data?.length || 0,
        resolvedCount: resolved,
      });
      if (unreadRes.data && typeof unreadRes.data.count === 'number') {
        setUnreadCount(unreadRes.data.count);
      }
    }).catch(console.error);
  }, []);

  const handleAvatarFileSelect = (e) => {
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

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setAvatarError('');
  };

  const handleCancelPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveAvatar = async () => {
    if (!selectedFile) return;

    setAvatarUploading(true);
    setAvatarError('');
    setAvatarSuccess('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      const res = await authApi.uploadAvatar(formData);
      if (res.success && res.data) {
        setProfileData(res.data);
        updateUser(res.data);
        setAvatarSuccess('Profile photo updated successfully!');
        handleCancelPreview();
        setTimeout(() => setAvatarSuccess(''), 4000);
      }
    } catch (err) {
      setAvatarError(err.response?.data?.message || err.message || 'Failed to upload photo.');
      setTimeout(() => setAvatarError(''), 5000);
    } finally {
      setAvatarUploading(false);
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
        handleCancelPreview();
        setTimeout(() => setAvatarSuccess(''), 4000);
      }
    } catch (err) {
      setAvatarError(err.response?.data?.message || err.message || 'Failed to remove photo.');
      setTimeout(() => setAvatarError(''), 4000);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Full name cannot be empty');
      return;
    }
    if (trimmed.length < 2) {
      setNameError('Full name must be at least 2 characters');
      return;
    }
    if (trimmed === profileData?.name) {
      setIsEditing(false);
      return;
    }

    setNameSaving(true);
    setNameError('');
    setNameSuccess('');

    try {
      const res = await authApi.updateProfile({ name: trimmed });
      if (res.success && res.data) {
        setProfileData(res.data);
        updateUser(res.data);
        setIsEditing(false);
        setNameSuccess('Profile name updated successfully!');
        setTimeout(() => setNameSuccess(''), 4000);
      }
    } catch (err) {
      setNameError(err.response?.data?.message || err.message || 'Failed to update profile name');
    } finally {
      setNameSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password. Verify your current password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out of your account?')) {
      logout();
      navigate('/login');
    }
  };

  const daysActive = profileData?.createdAt
    ? Math.max(1, Math.floor((new Date().getTime() - new Date(profileData.createdAt).getTime()) / (1000 * 60 * 60 * 24)))
    : 1;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Loading profile...
      </div>
    );
  }

  const currentDisplayPhoto = previewUrl || profileData?.avatarUrl;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1080, margin: '0 auto', width: '100%' }}>
      {/* Top 2 Cards: Compact Profile Card & Account Information Card */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.25rem',
        alignItems: 'stretch',
      }}>
        {/* Left Profile Card */}
        <div className="surface-card" style={{
          padding: '1.5rem',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Avatar with Camera Tooltip & Preview */}
            <div style={{ position: 'relative', width: 96, height: 96, marginBottom: '0.85rem' }}>
              <div 
                onClick={() => fileInputRef.current?.click()}
                title="Click to choose a new profile photo"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-blue-subtle)',
                  border: previewUrl ? '3px dashed var(--accent-coral)' : '3px solid var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: 'var(--accent-blue)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                {currentDisplayPhoto ? (
                  <img
                    src={currentDisplayPhoto}
                    alt={profileData?.name || 'Profile'}
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

              {/* Camera Icon Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
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
                title="Change Profile Photo"
              >
                <Camera size={15} strokeWidth={2.4} />
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileSelect}
                accept="image/png, image/jpeg, image/jpg, image/webp"
                style={{ display: 'none' }}
              />
            </div>

            {/* Photo Preview Actions Bar */}
            {previewUrl && (
              <div style={{
                display: 'flex',
                gap: '0.4rem',
                marginBottom: '0.75rem',
                backgroundColor: 'var(--bg-elevated)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}>
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={avatarUploading}
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                >
                  <Save size={13} /> {avatarUploading ? 'Saving...' : 'Save Photo'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={avatarUploading}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem' }}
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Avatar Alerts */}
            {avatarSuccess && (
              <div style={{
                padding: '0.4rem 0.6rem',
                backgroundColor: 'var(--status-found-bg)',
                border: '1px solid var(--status-found-border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--status-found-text)',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.65rem',
                width: '100%',
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
                marginBottom: '0.65rem',
                width: '100%',
              }}>
                {avatarError}
              </div>
            )}

            {/* Name with Verified Badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {profileData?.name}
              </h2>
              {isVerified && (
                <span title="Verified Campus Member" style={{ display: 'inline-flex', color: 'var(--accent-blue)', verticalAlign: 'middle' }}>
                  <CheckCircle2 size={17} fill="currentColor" color="var(--bg-surface)" />
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem', marginBottom: '0.25rem' }}>
              {profileData?.email}
            </p>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontSize: '0.75rem',
              color: isVerified ? '#16A34A' : 'var(--text-muted)',
              backgroundColor: isVerified ? 'var(--status-found-bg)' : 'var(--bg-elevated)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              fontWeight: 600,
              marginTop: '0.25rem',
            }}>
              <ShieldCheck size={13} /> {isVerified ? 'Verified Student Account' : 'Verification Pending'}
            </div>

            {/* Secondary Photo Controls */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
              >
                <Camera size={13} /> Edit Photo
              </button>
              {profileData?.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={avatarUploading}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', color: 'var(--status-lost-text)', padding: '0.25rem 0.6rem' }}
                  title="Remove current photo"
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
          </div>

          {/* Bottom Card Actions: Edit Profile Name */}
          <div style={{ width: '100%', borderTop: '1px solid var(--border-subtle)', marginTop: '1.25rem', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-primary btn-sm"
              style={{ width: '100%', padding: '0.45rem 1rem' }}
            >
              <Edit3 size={14} /> {isEditing ? 'Cancel Edit' : 'Edit Profile Name'}
            </button>
          </div>
        </div>

        {/* Right Account Information Card */}
        <div className="surface-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Account Information
            </h3>
            {unreadCount > 0 && (
              <Link
                to="/messages"
                className="badge"
                style={{
                  backgroundColor: 'var(--accent-coral-subtle)',
                  color: 'var(--accent-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  textDecoration: 'none',
                  fontSize: '0.75rem',
                  padding: '0.25rem 0.6rem',
                }}
              >
                <Bell size={12} /> {unreadCount} Unread Message{unreadCount > 1 ? 's' : ''}
              </Link>
            )}
          </div>

          {nameSuccess && (
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-found-bg)', border: '1px solid var(--status-found-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-found-text)', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle2 size={15} /> {nameSuccess}
            </div>
          )}

          {nameError && (
            <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-lost-bg)', border: '1px solid var(--status-lost-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-lost-text)', fontSize: '0.8125rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={15} /> {nameError}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleUpdateProfile} style={{ marginBottom: '1.25rem' }}>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  FULL NAME
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  minLength={2}
                  style={{ height: 38 }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" disabled={nameSaving} className="btn btn-primary btn-sm" style={{ padding: '0.45rem 1rem' }}>
                  <Save size={14} /> {nameSaving ? 'Saving...' : 'Save Name'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary btn-sm" style={{ padding: '0.45rem 0.85rem' }}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              backgroundColor: 'var(--bg-elevated)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.5rem',
            }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>FULL NAME</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>
                  {profileData?.name}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>CAMPUS EMAIL</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                  {profileData?.email}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>ROLE & STATUS</div>
                <div style={{ fontWeight: 700, color: isVerified ? '#16A34A' : 'var(--text-primary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>
                  {profileData?.role} ({isVerified ? 'Verified' : 'Pending'})
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em' }}>MEMBER SINCE</div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem', fontSize: '0.9rem' }}>
                  {profileData?.createdAt ? format(new Date(profileData.createdAt), 'MMMM d, yyyy') : 'Recent'}
                </div>
              </div>
            </div>
          )}

          {/* Change Password Section */}
          <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <KeyRound size={16} color="var(--accent-blue)" />
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Change Password
              </h4>
            </div>

            {passwordSuccess && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-found-bg)', border: '1px solid var(--status-found-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-found-text)', fontSize: '0.8125rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={15} /> {passwordSuccess}
              </div>
            )}

            {passwordError && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-lost-bg)', border: '1px solid var(--status-lost-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-lost-text)', fontSize: '0.8125rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={15} /> {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem', alignItems: 'center' }}>
              {/* Current Password with Show/Hide toggle */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  style={{ height: 38, paddingRight: '2.2rem', fontSize: '0.8125rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                  }}
                  title={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* New Password with Show/Hide toggle */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="New password (min 6)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ height: 38, paddingRight: '2.2rem', fontSize: '0.8125rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                  }}
                  title={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Confirm Password with Show/Hide toggle */}
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{
                    height: 38,
                    paddingRight: '2.2rem',
                    fontSize: '0.8125rem',
                    borderColor: confirmPassword && newPassword !== confirmPassword ? 'var(--status-lost-text)' : undefined,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 2,
                    display: 'flex',
                  }}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {confirmPassword && newPassword && (
                <div style={{
                  gridColumn: '1 / -1',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: newPassword === confirmPassword ? '#16A34A' : 'var(--status-lost-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '-0.25rem',
                }}>
                  {newPassword === confirmPassword ? (
                    <><Check size={13} /> Passwords match</>
                  ) : (
                    <><AlertCircle size={13} /> Passwords do not match</>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={passwordSaving || (Boolean(confirmPassword) && newPassword !== confirmPassword)}
                className="btn btn-primary btn-sm"
                style={{ height: 38, padding: '0 1rem' }}
              >
                {passwordSaving ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Quick Stats Row with Icons & Navigation */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Quick Stats
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Click a card to navigate
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '1rem',
        }}>
          {/* Card 1: Posts */}
          <div
            onClick={() => navigate('/items/my-items')}
            className="surface-card surface-card-hover"
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            }}
            title="View your reported items"
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-yellow-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.2rem',
            }}>
              <Package size={20} color="var(--accent-yellow)" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-yellow)', lineHeight: 1 }}>
              {stats.itemsCount}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Posts
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Manage listings →
            </div>
          </div>

          {/* Card 2: Matches */}
          <div
            onClick={() => navigate('/matches')}
            className="surface-card surface-card-hover"
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            }}
            title="View smart match suggestions"
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-coral-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.2rem',
            }}>
              <Sparkles size={20} color="var(--accent-coral)" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-coral)', lineHeight: 1 }}>
              {stats.matchesCount}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Matches
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Review pairings →
            </div>
          </div>

          {/* Card 3: Items Recovered */}
          <div
            onClick={() => navigate('/items/my-items')}
            className="surface-card surface-card-hover"
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
            }}
            title="View resolved and returned items"
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-found-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.2rem',
            }}>
              <CheckCircle2 size={20} color="#16A34A" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>
              {stats.resolvedCount}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Items Recovered
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Resolved cases →
            </div>
          </div>

          {/* Card 4: Days Active */}
          <div
            className="surface-card"
            style={{
              padding: '1.25rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
            }}
            title={`Active on campus portal since ${profileData?.createdAt ? format(new Date(profileData.createdAt), 'MMM yyyy') : 'Recently'}`}
          >
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--accent-blue-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.2rem',
            }}>
              <Clock size={20} color="var(--accent-blue)" />
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--accent-blue)', lineHeight: 1 }}>
              {daysActive}
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Days Active
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Campus Member
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
