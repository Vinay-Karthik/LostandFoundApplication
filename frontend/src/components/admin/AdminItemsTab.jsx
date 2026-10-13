import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Package, Eye, Trash2 } from 'lucide-react';

/**
 * AdminItemsTab
 * Responsibility: Displays campus lost & found item listings with filtering and status controls.
 */
export const AdminItemsTab = ({
  items,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  onApplyFilter,
  onItemStatusChange,
  onDeleteItem
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Items Filter Toolbar */}
      <div className="surface-card" style={{ padding: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-elevated)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Filter by title, location, reporter..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onApplyFilter()}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.875rem' }}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
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
          value={categoryFilter}
          onChange={(e) => onCategoryFilterChange(e.target.value)}
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

        <button onClick={onApplyFilter} className="btn btn-primary btn-sm" style={{ height: 38 }}>
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
            {loading ? (
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
                      onChange={(e) => onItemStatusChange(i.id, e.target.value)}
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
                        type="button"
                        onClick={() => onDeleteItem(i.id)}
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
  );
};
