import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { 
  ShieldCheck, UserCheck, UserX, AlertTriangle, 
  Trash2, Package, Eye, Users, Sparkles, Search, 
  Filter, Check, X, ArrowUpRight, Shield, RefreshCw,
  UserPlus, Edit, KeyRound, Lock, User, Ban, CheckCircle2, AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { format } from 'date-fns';

export const AdminPortal = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'users' | 'items' | 'matches' | 'flags'
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Users State
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userVerifiedFilter, setUserVerifiedFilter] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // User Modals State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserData, setCreateUserData] = useState({ name: '', email: '', password: '', role: 'STUDENT', verified: true, suspended: false });
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState('');

  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [editUserData, setEditUserData] = useState({ name: '', email: '', role: 'STUDENT', verified: true, suspended: false, newPassword: '' });
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState('');

  // User Details & Activity Modal State
  const [inspectingUser, setInspectingUser] = useState(null);
  const [inspectingUserData, setInspectingUserData] = useState(null);
  const [inspectingUserLoading, setInspectingUserLoading] = useState(false);

  // Items State
  const [items, setItems] = useState([]);
  const [itemStatusFilter, setItemStatusFilter] = useState('');
  const [itemCategoryFilter, setItemCategoryFilter] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [itemsLoading, setItemsLoading] = useState(false);

  // Matches State
  const [matches, setMatches] = useState([]);
  const [matchStatusFilter, setMatchStatusFilter] = useState('');
  const [matchesLoading, setMatchesLoading] = useState(false);

  // Flags State
  const [flags, setFlags] = useState([]);
  const [flagsLoading, setFlagsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/login');
      return;
    }
    loadInitialData();
  }, [isAuthenticated, isAdmin, navigate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const statsRes = await adminApi.getStatsSummary();
      if (statsRes.success) setStats(statsRes.data);
      loadUsers();
      loadItems();
      loadMatches();
      loadFlags();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // --- Users Handlers ---
  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const params = {
        search: userSearch || undefined,
        role: userRoleFilter || undefined,
        verified: userVerifiedFilter !== '' ? userVerifiedFilter === 'true' : undefined,
        size: 100,
      };
      const res = await adminApi.getAllUsers(params);
      if (res.success && res.data) {
        setUsers(res.data.content || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateUserLoading(true);
    setCreateUserError('');
    try {
      const res = await adminApi.createUser(createUserData);
      if (res.success) {
        setShowCreateUserModal(false);
        setCreateUserData({ name: '', email: '', password: '', role: 'STUDENT', verified: true, suspended: false });
        loadUsers();
        refreshStats();
      }
    } catch (err) {
      setCreateUserError(err.message || 'Failed to create user');
    } finally {
      setCreateUserLoading(false);
    }
  };

  const openEditUser = (user) => {
    setSelectedUserToEdit(user);
    setEditUserData({
      name: user.name,
      email: user.email,
      role: user.role,
      verified: Boolean(user.verified),
      suspended: Boolean(user.suspended),
      newPassword: '',
    });
    setEditUserError('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;
    setEditUserLoading(true);
    setEditUserError('');
    try {
      const payload = {
        name: editUserData.name,
        email: editUserData.email,
        role: editUserData.role,
        verified: editUserData.verified,
        suspended: editUserData.suspended,
        newPassword: editUserData.newPassword || undefined,
      };
      const res = await adminApi.updateUser(selectedUserToEdit.id, payload);
      if (res.success) {
        setSelectedUserToEdit(null);
        loadUsers();
        if (inspectingUser?.id === selectedUserToEdit.id) {
          openInspectUser(selectedUserToEdit.id);
        }
        refreshStats();
      }
    } catch (err) {
      setEditUserError(err.message || 'Failed to update user');
    } finally {
      setEditUserLoading(false);
    }
  };

  const openInspectUser = async (userId) => {
    setInspectingUser({ id: userId });
    setInspectingUserLoading(true);
    try {
      const res = await adminApi.getUserDetails(userId);
      if (res.success && res.data) {
        setInspectingUserData(res.data);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load user activity details');
    } finally {
      setInspectingUserLoading(false);
    }
  };

  const handleToggleVerification = async (userId, newVerifiedStatus) => {
    try {
      await adminApi.toggleUserVerification(userId, newVerifiedStatus);
      loadUsers();
      if (inspectingUserData?.user?.id === userId) {
        setInspectingUserData({
          ...inspectingUserData,
          user: { ...inspectingUserData.user, verified: newVerifiedStatus },
        });
      }
      refreshStats();
    } catch (err) {
      alert(err.message || 'Failed to update user verification');
    }
  };

  const handleToggleSuspension = async (userId, newSuspendedStatus) => {
    const action = newSuspendedStatus ? 'suspend' : 'reinstate';
    if (!window.confirm(`Are you sure you want to ${action} this user's account access?`)) return;
    try {
      await adminApi.toggleUserSuspension(userId, newSuspendedStatus);
      loadUsers();
      if (inspectingUserData?.user?.id === userId) {
        setInspectingUserData({
          ...inspectingUserData,
          user: { ...inspectingUserData.user, suspended: newSuspendedStatus },
        });
      }
      refreshStats();
    } catch (err) {
      alert(err.message || 'Failed to update user suspension');
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Permanently delete user ${userEmail}? This will delete their account, messages, and listings.`)) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      if (inspectingUser?.id === userId) {
        setInspectingUser(null);
        setInspectingUserData(null);
      }
      refreshStats();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // --- Items Handlers ---
  const loadItems = async () => {
    setItemsLoading(true);
    try {
      const params = {
        status: itemStatusFilter || undefined,
        category: itemCategoryFilter || undefined,
        size: 100,
      };
      const res = await adminApi.getAdminItems(params);
      if (res.success && res.data) {
        let filtered = res.data.content || [];
        if (itemSearch.trim()) {
          const q = itemSearch.toLowerCase().trim();
          filtered = filtered.filter(i => 
            i.title?.toLowerCase().includes(q) || 
            i.location?.toLowerCase().includes(q) ||
            i.userName?.toLowerCase().includes(q)
          );
        }
        setItems(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleItemStatusChange = async (itemId, newStatus) => {
    try {
      await adminApi.setItemStatus(itemId, newStatus, 'Admin panel status override');
      loadItems();
      refreshStats();
    } catch (err) {
      alert(err.message || 'Failed to update item status');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to permanently delete this item listing?')) return;
    try {
      await adminApi.deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      if (inspectingUserData) {
        setInspectingUserData({
          ...inspectingUserData,
          items: inspectingUserData.items.filter(i => i.id !== itemId),
        });
      }
      refreshStats();
    } catch (err) {
      alert(err.message || 'Failed to delete item');
    }
  };

  // --- Matches Handlers ---
  const loadMatches = async () => {
    setMatchesLoading(true);
    try {
      const params = {
        status: matchStatusFilter || undefined,
        size: 100,
      };
      const res = await adminApi.getAdminMatches(params);
      if (res.success && res.data) {
        setMatches(res.data.content || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setMatchesLoading(false);
    }
  };

  const handleMatchStatusChange = async (matchId, newStatus) => {
    try {
      await adminApi.setMatchStatus(matchId, newStatus);
      loadMatches();
      refreshStats();
    } catch (err) {
      alert(err.message || 'Failed to update match status');
    }
  };

  // --- Flags Handlers ---
  const loadFlags = async () => {
    setFlagsLoading(true);
    try {
      const res = await adminApi.getFlags();
      if (res.success && res.data) {
        setFlags(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setFlagsLoading(false);
    }
  };

  const handleResolveFlag = async (flagId, removeItem) => {
    try {
      await adminApi.resolveFlag(flagId, { removeItem, note: 'Admin resolved' });
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
      loadItems();
      refreshStats();
    } catch (err) {
      alert(err.message || 'Failed to resolve flag');
    }
  };

  const refreshStats = async () => {
    const statsRes = await adminApi.getStatsSummary();
    if (statsRes.success) setStats(statsRes.data);
  };

  const chartData = stats?.categoryBreakdown
    ? Object.entries(stats.categoryBreakdown).map(([key, val]) => ({ name: key, count: val }))
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Campus Administration Control Panel
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Full control over campus user accounts, lost & found listings, automated pairings, and safety reports.
          </p>
        </div>

        <button 
          onClick={loadInitialData} 
          className="btn btn-secondary btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RefreshCw size={14} /> Refresh Data
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`tab-chip ${activeTab === 'analytics' ? 'active' : ''}`}
        >
          📊 Overview & Metrics
        </button>
        <button
          onClick={() => { setActiveTab('users'); loadUsers(); }}
          className={`tab-chip ${activeTab === 'users' ? 'active' : ''}`}
        >
          👥 User Management ({users.length})
        </button>
        <button
          onClick={() => { setActiveTab('items'); loadItems(); }}
          className={`tab-chip ${activeTab === 'items' ? 'active' : ''}`}
        >
          📦 Item Listings ({items.length})
        </button>
        <button
          onClick={() => { setActiveTab('matches'); loadMatches(); }}
          className={`tab-chip ${activeTab === 'matches' ? 'active' : ''}`}
        >
          ⚡ System Matches ({matches.length})
        </button>
        <button
          onClick={() => { setActiveTab('flags'); loadFlags(); }}
          className={`tab-chip ${activeTab === 'flags' ? 'active' : ''}`}
        >
          🚩 Flagged Reports ({flags.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Key Metric Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {stats?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                Total Users in Database
              </div>
            </div>

            <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-coral)' }}>
                {stats?.totalLost || 0}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                Lost Reports
              </div>
            </div>

            <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16A34A' }}>
                {stats?.totalFound || 0}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                Found Items
              </div>
            </div>

            <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>
                {stats?.recoveryRate || 0}%
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                Recovery Rate
              </div>
            </div>

            <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-blue)' }}>
                {stats?.totalMatched || 0}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                Matched Items
              </div>
            </div>

            <div className="surface-card" style={{ padding: '1.25rem', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: flags.length > 0 ? 'var(--status-lost-text)' : 'var(--text-primary)' }}>
                {flags.length}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                Open Flags
              </div>
            </div>
          </div>

          {/* Category Bar Chart */}
          <div className="surface-card" style={{ padding: '1.5rem', backgroundColor: 'var(--bg-surface)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>
              Category Distribution
            </h3>
            {chartData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No category data available
              </div>
            ) : (
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', borderRadius: 8, color: 'var(--text-primary)' }} 
                    />
                    <Bar dataKey="count" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* User Actions & Filters Toolbar */}
          <div className="surface-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-elevated)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>

            <select
              value={userRoleFilter}
              onChange={(e) => { setUserRoleFilter(e.target.value); }}
              className="form-input"
              style={{ width: 'auto', height: 38 }}
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={userVerifiedFilter}
              onChange={(e) => { setUserVerifiedFilter(e.target.value); }}
              className="form-input"
              style={{ width: 'auto', height: 38 }}
            >
              <option value="">All Verification</option>
              <option value="true">Verified Only</option>
              <option value="false">Pending Verification</option>
            </select>

            <button onClick={loadUsers} className="btn btn-secondary btn-sm" style={{ height: 38 }}>
              Search
            </button>

            <button 
              onClick={() => { setShowCreateUserModal(true); setCreateUserError(''); }} 
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
                {usersLoading ? (
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
                            onClick={() => openInspectUser(u.id)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                            title="Inspect user activity & items"
                          >
                            <Eye size={13} /> Inspect
                          </button>

                          <button
                            onClick={() => openEditUser(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.55rem' }}
                            title="Edit user details"
                          >
                            <Edit size={13} /> Edit
                          </button>

                          <button
                            onClick={() => handleToggleSuspension(u.id, !u.suspended)}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: u.suspended ? '#16A34A' : 'var(--status-lost-text)' }}
                            title={u.suspended ? 'Unsuspend user' : 'Suspend / Ban user'}
                          >
                            <Ban size={13} /> {u.suspended ? 'Unsuspend' : 'Suspend'}
                          </button>

                          <button
                            onClick={() => handleToggleVerification(u.id, !u.verified)}
                            className="btn btn-ghost btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                            title={u.verified ? 'Revoke verification' : 'Verify student'}
                          >
                            {u.verified ? 'Unverify' : 'Verify'}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
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
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ITEM LISTINGS CATALOG */}
      {/* ========================================================================= */}
      {activeTab === 'items' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Items Filter Toolbar */}
          <div className="surface-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-elevated)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Filter by title, location, reporter..."
                value={itemSearch}
                onChange={(e) => setItemSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadItems()}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
              />
            </div>

            <select
              value={itemStatusFilter}
              onChange={(e) => { setItemStatusFilter(e.target.value); }}
              className="form-input"
              style={{ width: 'auto', height: 38 }}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="MATCHED">Matched</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REMOVED">Removed</option>
            </select>

            <select
              value={itemCategoryFilter}
              onChange={(e) => { setItemCategoryFilter(e.target.value); }}
              className="form-input"
              style={{ width: 'auto', height: 38 }}
            >
              <option value="">All Categories</option>
              <option value="Electronics">Electronics</option>
              <option value="Keys">Keys</option>
              <option value="Bags">Bags</option>
              <option value="Clothing">Clothing</option>
              <option value="Documents">Documents</option>
              <option value="Accessories">Accessories</option>
              <option value="Other">Other</option>
            </select>

            <button onClick={loadItems} className="btn btn-primary btn-sm" style={{ height: 38 }}>
              Apply Filter
            </button>
          </div>

          {/* Items Table */}
          <div className="surface-card" style={{ padding: '0', overflowX: 'auto', backgroundColor: 'var(--bg-surface)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Item</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Reporter</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemsLoading ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Loading campus items...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No items found
                    </td>
                  </tr>
                ) : (
                  items.map((i) => (
                    <tr key={i.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-elevated)',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--border-subtle)',
                          }}>
                            {i.imageUrl ? (
                              <img src={i.imageUrl} alt={i.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Package size={16} color="var(--text-muted)" />
                            )}
                          </div>
                          <Link to={`/items/${i.id}`} style={{ fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none' }}>
                            {i.title}
                          </Link>
                        </div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span className={`badge ${i.type === 'LOST' ? 'badge-lost' : 'badge-found'}`}>
                          {i.type}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{i.category}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{i.location || 'Campus'}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-secondary)' }}>{i.userName || 'Anonymous'}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <select
                          value={i.status}
                          onChange={(e) => handleItemStatusChange(i.id, e.target.value)}
                          className="form-input"
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', height: 28, width: 'auto' }}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="MATCHED">MATCHED</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="REMOVED">REMOVED</option>
                        </select>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <Link to={`/items/${i.id}`} className="btn btn-ghost btn-sm" style={{ padding: '0.25rem 0.4rem' }} title="View listing">
                            <Eye size={13} />
                          </Link>
                          <button
                            onClick={() => handleDeleteItem(i.id)}
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--status-lost-text)', padding: '0.25rem 0.4rem' }}
                            title="Delete item"
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
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SYSTEM MATCHES */}
      {/* ========================================================================= */}
      {activeTab === 'matches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Matches Filter Toolbar */}
          <div className="surface-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Match Status:</span>
            <select
              value={matchStatusFilter}
              onChange={(e) => { setMatchStatusFilter(e.target.value); }}
              className="form-input"
              style={{ width: 'auto', height: 38 }}
            >
              <option value="">All Statuses</option>
              <option value="SUGGESTED">Suggested</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <button onClick={loadMatches} className="btn btn-primary btn-sm" style={{ height: 38 }}>
              Apply Filter
            </button>
          </div>

          {/* Matches List */}
          {matchesLoading ? (
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
                        onClick={() => handleMatchStatusChange(m.id, 'CONFIRMED')}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Check size={13} /> Confirm
                      </button>
                    )}
                    {m.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleMatchStatusChange(m.id, 'REJECTED')}
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
      )}

      {/* ========================================================================= */}
      {/* TAB 5: FLAGGED REPORTS & MODERATION */}
      {/* ========================================================================= */}
      {activeTab === 'flags' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {flagsLoading ? (
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
                    onClick={() => handleResolveFlag(flag.id, false)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '0.4rem 0.85rem' }}
                  >
                    <Check size={14} /> Dismiss Flag
                  </button>

                  <button
                    onClick={() => handleResolveFlag(flag.id, true)}
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
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW USER */}
      {/* ========================================================================= */}
      {showCreateUserModal && (
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
                <UserPlus size={20} color="var(--accent-blue)" /> Add New Campus User
              </h3>
              <button 
                onClick={() => setShowCreateUserModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {createUserError && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-lost-bg)', border: '1px solid var(--status-lost-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-lost-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {createUserError}
              </div>
            )}

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={createUserData.name}
                  onChange={(e) => setCreateUserData({ ...createUserData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">University Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="student@university.edu"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Temporary Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Role</label>
                  <select
                    className="form-input"
                    value={createUserData.role}
                    onChange={(e) => setCreateUserData({ ...createUserData, role: e.target.value })}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Verification Status</label>
                  <select
                    className="form-input"
                    value={createUserData.verified ? 'true' : 'false'}
                    onChange={(e) => setCreateUserData({ ...createUserData, verified: e.target.value === 'true' })}
                  >
                    <option value="true">Verified Immediately</option>
                    <option value="false">Pending Verification</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateUserModal(false)} 
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createUserLoading} 
                  className="btn btn-primary btn-sm"
                >
                  {createUserLoading ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT USER DETAILS */}
      {/* ========================================================================= */}
      {selectedUserToEdit && (
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
                onClick={() => setSelectedUserToEdit(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {editUserError && (
              <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--status-lost-bg)', border: '1px solid var(--status-lost-border)', borderRadius: 'var(--radius-sm)', color: 'var(--status-lost-text)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                {editUserError}
              </div>
            )}

            <form onSubmit={handleUpdateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={editUserData.name}
                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Account Role</label>
                  <select
                    className="form-input"
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Account Status</label>
                  <select
                    className="form-input"
                    value={editUserData.suspended ? 'true' : 'false'}
                    onChange={(e) => setEditUserData({ ...editUserData, suspended: e.target.value === 'true' })}
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
                  value={editUserData.verified ? 'true' : 'false'}
                  onChange={(e) => setEditUserData({ ...editUserData, verified: e.target.value === 'true' })}
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
                  value={editUserData.newPassword}
                  onChange={(e) => setEditUserData({ ...editUserData, newPassword: e.target.value })}
                  minLength={6}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Enter a new password (min 6 characters) if you need to reset this user's password.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedUserToEdit(null)} 
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={editUserLoading} 
                  className="btn btn-primary btn-sm"
                >
                  {editUserLoading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: INSPECT USER PROFILE & ACTIVITY */}
      {/* ========================================================================= */}
      {inspectingUser && (
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
                onClick={() => { setInspectingUser(null); setInspectingUserData(null); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {inspectingUserLoading || !inspectingUserData ? (
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
                    {inspectingUserData.user.avatarUrl ? (
                      <img src={inspectingUserData.user.avatarUrl} alt={inspectingUserData.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      inspectingUserData.user.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {inspectingUserData.user.name}
                      </h4>
                      <span className={`badge ${inspectingUserData.user.role === 'ADMIN' ? 'badge-matched' : 'badge-found'}`}>
                        {inspectingUserData.user.role}
                      </span>
                      <span style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: inspectingUserData.user.suspended ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        color: inspectingUserData.user.suspended ? 'var(--status-lost-text)' : '#16A34A',
                      }}>
                        {inspectingUserData.user.suspended ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {inspectingUserData.user.email} • ID #{inspectingUserData.user.id}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Joined: {inspectingUserData.user.createdAt ? format(new Date(inspectingUserData.user.createdAt), 'MMMM dd, yyyy') : 'Recent'}
                    </div>
                  </div>
                </div>

                {/* Activity Stats Counter */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>{inspectingUserData.totalItems}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total Items</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--status-lost-text)' }}>{inspectingUserData.lostCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Lost Reports</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16A34A' }}>{inspectingUserData.foundCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Found Items</div>
                  </div>
                  <div style={{ backgroundColor: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-yellow)' }}>{inspectingUserData.resolvedCount}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Resolved</div>
                  </div>
                </div>

                {/* Items Posted By User */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    Posted Listings ({inspectingUserData.items.length})
                  </h4>

                  {inspectingUserData.items.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', backgroundColor: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                      This user has not posted any items yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                      {inspectingUserData.items.map(item => (
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
                              onClick={() => handleDeleteItem(item.id)}
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
                    onClick={() => handleDeleteUser(inspectingUserData.user.id, inspectingUserData.user.email)}
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--status-lost-text)' }}
                  >
                    <Trash2 size={14} /> Delete Account
                  </button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleToggleSuspension(inspectingUserData.user.id, !inspectingUserData.user.suspended)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Ban size={14} /> {inspectingUserData.user.suspended ? 'Unsuspend Account' : 'Suspend Account'}
                    </button>
                    <button
                      onClick={() => {
                        const user = inspectingUserData.user;
                        setInspectingUser(null);
                        openEditUser(user);
                      }}
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
      )}
    </div>
  );
};
