import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api/adminApi';
import { useAuth } from '../context/AuthContext';
import { RefreshCw } from 'lucide-react';

// Modular Subcomponents
import { AdminOverviewTab } from '../components/admin/AdminOverviewTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { AdminItemsTab } from '../components/admin/AdminItemsTab';
import { AdminMatchesTab } from '../components/admin/AdminMatchesTab';
import { AdminFlagsTab } from '../components/admin/AdminFlagsTab';

// Modals
import { CreateUserModal } from '../components/admin/CreateUserModal';
import { EditUserModal } from '../components/admin/EditUserModal';
import { InspectUserModal } from '../components/admin/InspectUserModal';

/**
 * AdminPortal
 * Responsibility: Orchestrates administrative data flows, tab routing, and lifecycle events.
 * Modular presentation is delegated to single-responsibility subcomponents.
 */
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

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'analytics' && (
        <AdminOverviewTab stats={stats} flagsCount={flags.length} />
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          loading={usersLoading}
          search={userSearch}
          onSearchChange={setUserSearch}
          roleFilter={userRoleFilter}
          onRoleFilterChange={setUserRoleFilter}
          verifiedFilter={userVerifiedFilter}
          onVerifiedFilterChange={setUserVerifiedFilter}
          onSearchSubmit={loadUsers}
          onAddUser={() => { setShowCreateUserModal(true); setCreateUserError(''); }}
          onInspectUser={openInspectUser}
          onEditUser={openEditUser}
          onToggleSuspension={handleToggleSuspension}
          onToggleVerification={handleToggleVerification}
          onDeleteUser={handleDeleteUser}
        />
      )}

      {/* TAB 3: ITEM LISTINGS CATALOG */}
      {activeTab === 'items' && (
        <AdminItemsTab
          items={items}
          loading={itemsLoading}
          search={itemSearch}
          onSearchChange={setItemSearch}
          statusFilter={itemStatusFilter}
          onStatusFilterChange={setItemStatusFilter}
          categoryFilter={itemCategoryFilter}
          onCategoryFilterChange={setItemCategoryFilter}
          onApplyFilter={loadItems}
          onItemStatusChange={handleItemStatusChange}
          onDeleteItem={handleDeleteItem}
        />
      )}

      {/* TAB 4: SYSTEM MATCHES */}
      {activeTab === 'matches' && (
        <AdminMatchesTab
          matches={matches}
          loading={matchesLoading}
          statusFilter={matchStatusFilter}
          onStatusFilterChange={setMatchStatusFilter}
          onApplyFilter={loadMatches}
          onMatchStatusChange={handleMatchStatusChange}
        />
      )}

      {/* TAB 5: FLAGGED REPORTS & MODERATION */}
      {activeTab === 'flags' && (
        <AdminFlagsTab
          flags={flags}
          loading={flagsLoading}
          onResolveFlag={handleResolveFlag}
        />
      )}

      {/* USER MODALS */}
      <CreateUserModal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        formData={createUserData}
        onChange={setCreateUserData}
        onSubmit={handleCreateUser}
        loading={createUserLoading}
        error={createUserError}
      />

      <EditUserModal
        isOpen={Boolean(selectedUserToEdit)}
        onClose={() => setSelectedUserToEdit(null)}
        formData={editUserData}
        onChange={setEditUserData}
        onSubmit={handleUpdateUser}
        loading={editUserLoading}
        error={editUserError}
      />

      <InspectUserModal
        isOpen={Boolean(inspectingUser)}
        onClose={() => { setInspectingUser(null); setInspectingUserData(null); }}
        userData={inspectingUserData}
        loading={inspectingUserLoading}
        onDeleteItem={handleDeleteItem}
        onDeleteUser={handleDeleteUser}
        onToggleSuspension={handleToggleSuspension}
        onOpenEdit={(user) => {
          setInspectingUser(null);
          openEditUser(user);
        }}
      />
    </div>
  );
};
