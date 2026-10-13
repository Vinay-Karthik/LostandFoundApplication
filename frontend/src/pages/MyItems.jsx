import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { itemApi } from '../api/itemApi';
import { useAuth } from '../context/AuthContext';
import { Plus, Package, MapPin, CheckCircle2, ImageOff, Printer, Trash2 } from 'lucide-react';
import { ResolutionModal } from '../components/ResolutionModal';
import { StatusBadge } from '../components/StatusBadge';

export const MyItems = () => {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [resolutionItem, setResolutionItem] = useState(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchItems = () => {
    setLoading(true);
    itemApi.getMyItems().then((res) => {
      if (res.success && res.data) {
        setItems(res.data);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchItems();
  }, [isAuthenticated, navigate]);

  const handleResolve = async (item) => {
    if (window.confirm(`Mark "${item.title}" as resolved / returned?`)) {
      await itemApi.updateItemJson(item.id, { status: 'RESOLVED' });
      setResolutionItem(item);
      fetchItems();
    }
  };

  const handleDelete = async (item) => {
    if (window.confirm(`Are you sure you want to permanently delete "${item.title}"?`)) {
      try {
        await itemApi.deleteItem(item.id);
        fetchItems();
      } catch (err) {
        console.error('Failed to delete item:', err);
        alert(err.response?.data?.message || 'Failed to delete listing.');
      }
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'LOST') return item.type === 'LOST';
    if (activeTab === 'FOUND') return item.type === 'FOUND';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>My Posts</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Manage all the lost and found items you have reported.
          </p>
        </div>
        <Link 
          to="/post" 
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={16} strokeWidth={2.4} /> Report Item
        </Link>
      </div>

      {/* Tabs: All | Lost | Found */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`tab-chip ${activeTab === 'ALL' ? 'active' : ''}`}
        >
          All ({items.length})
        </button>
        <button
          onClick={() => setActiveTab('LOST')}
          className={`tab-chip ${activeTab === 'LOST' ? 'active' : ''}`}
        >
          Lost ({items.filter(i => i.type === 'LOST').length})
        </button>
        <button
          onClick={() => setActiveTab('FOUND')}
          className={`tab-chip ${activeTab === 'FOUND' ? 'active' : ''}`}
        >
          Found ({items.filter(i => i.type === 'FOUND').length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading your posts...
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <Package size={42} color="var(--accent-blue)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} items reported yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
            When you report lost or found items, they will be tracked and managed here.
          </p>
          <Link to="/post" className="btn btn-primary btn-sm">
            Post an Item Now
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredItems.map((item) => {
            const isResolved = item.status === 'RESOLVED';

            return (
              <div
                key={item.id}
                className="surface-card surface-card-hover"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  backgroundColor: 'var(--bg-surface)',
                }}
              >
                {/* Left Cluster: Thumbnail + Info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 260 }}>
                  {/* Thumbnail with robust error fallback */}
                  <div style={{
                    width: 68,
                    height: 68,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) {
                            e.currentTarget.nextSibling.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div style={{ display: item.imageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageOff size={22} color="var(--text-muted)" />
                    </div>
                  </div>

                  {/* Details with robust title wrapping */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <StatusBadge itemType={item.type} size="xs" />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {item.category}
                      </span>
                      <StatusBadge itemStatus={item.status} size="xs" />
                    </div>

                    <Link 
                      to={`/items/${item.id}`} 
                      style={{ 
                        fontWeight: 700, 
                        fontSize: '1rem', 
                        color: 'var(--text-primary)',
                        lineHeight: 1.35,
                        wordBreak: 'break-word',
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.location || 'Campus'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Cluster: Matches Stat + Grouped Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginLeft: 'auto' }}>
                  {/* Match Stats Counter */}
                  <div style={{ textAlign: 'center', minWidth: 50 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: item.matchCount > 0 ? 'var(--accent-blue)' : 'var(--text-primary)' }}>
                      {item.matchCount || 0}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>Matches</div>
                  </div>

                  {/* Grouped Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Link to={`/items/${item.id}`} className="btn btn-secondary btn-sm">
                      View
                    </Link>
                    {!isResolved ? (
                      <button
                        onClick={() => handleResolve(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#16A34A', borderColor: 'rgba(22, 163, 74, 0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        title="Mark Resolved"
                      >
                        <CheckCircle2 size={14} /> Resolve
                      </button>
                    ) : (
                      <button
                        onClick={() => setResolutionItem(item)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        title="View Handover Receipt"
                      >
                        <Printer size={14} /> Receipt
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(item)}
                      className="btn btn-ghost btn-sm"
                      style={{ color: 'var(--status-lost-text)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      title="Delete Listing"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution & Handover Receipt Modal */}
      {resolutionItem && (
        <ResolutionModal
          isOpen={Boolean(resolutionItem)}
          onClose={() => setResolutionItem(null)}
          item={resolutionItem}
        />
      )}
    </div>
  );
};
