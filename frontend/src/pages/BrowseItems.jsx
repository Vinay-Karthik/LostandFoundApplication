import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { itemApi } from '../api/itemApi';
import { Search, SlidersHorizontal, MapPin, ChevronLeft, ChevronRight, ImageOff, X, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ItemCard } from '../components/ItemCard';
import { FilterModal } from '../components/FilterModal';

export const BrowseItems = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const navigate = useNavigate();

  // Filters from URL
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const category = searchParams.get('category') || '';
  const location = searchParams.get('location') || '';
  const status = searchParams.get('status') || 'OPEN';
  const page = parseInt(searchParams.get('page') || '0', 10);

  useEffect(() => {
    itemApi.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const fetchItems = (showLoading = false) => {
    if (showLoading) setLoading(true);
    itemApi.getItems({
      search: search || undefined,
      type: type || undefined,
      category: category || undefined,
      location: location || undefined,
      status: status || undefined,
      page,
      size: 12,
    }).then((res) => {
      if (res.success && res.data) {
        setItems(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      }
    }).catch(console.error).finally(() => {
      if (showLoading) setLoading(false);
    });
  };

  useEffect(() => {
    fetchItems(true);

    const handleItemsUpdated = () => fetchItems(false);
    window.addEventListener('items-updated', handleItemsUpdated);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchItems(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchItems(false);
    }, 8000);

    return () => {
      window.removeEventListener('items-updated', handleItemsUpdated);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [search, type, category, location, status, page]);

  const updateParam = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val && val !== 'ALL') {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.set('page', '0');
    setSearchParams(params);
  };

  const handleApplyFilters = (newFilters) => {
    const params = new URLSearchParams(searchParams);
    if (newFilters.type && newFilters.type !== 'ALL') params.set('type', newFilters.type);
    else params.delete('type');

    if (newFilters.category) params.set('category', newFilters.category);
    else params.delete('category');

    if (newFilters.location) params.set('location', newFilters.location);
    else params.delete('location');

    if (newFilters.status) params.set('status', newFilters.status);
    else params.delete('status');

    params.set('page', '0');
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    const params = new URLSearchParams();
    setSearchParams(params);
  };

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = [type, category, location, (status !== 'OPEN' ? status : '')].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Lost & Found Directory</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Explore lost items and found reports across the university campus.
        </p>
      </div>

      {/* Search & Action Bar */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{
          flex: 1,
          minWidth: 260,
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search keywords, brand, location, item title..."
            value={search}
            onChange={(e) => updateParam('search', e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
          {search && (
            <button
              onClick={() => updateParam('search', '')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsFilterModalOpen(true)}
          className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
          style={{ height: 44, padding: '0 1.15rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <SlidersHorizontal size={16} /> Filters
          {activeFiltersCount > 0 && (
            <span style={{
              backgroundColor: '#FFFFFF',
              color: 'var(--accent-blue)',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '0.05rem 0.4rem',
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Type Quick Toggle Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => updateParam('type', '')}
          className={`filter-chip ${!type ? 'active' : ''}`}
        >
          All Items ({totalElements})
        </button>
        <button
          onClick={() => updateParam('type', 'LOST')}
          className={`filter-chip ${type === 'LOST' ? 'active' : ''}`}
        >
          Lost Only
        </button>
        <button
          onClick={() => updateParam('type', 'FOUND')}
          className={`filter-chip ${type === 'FOUND' ? 'active' : ''}`}
        >
          Found Only
        </button>
      </div>

      {/* Category Quick Filter Chips with obvious active states */}
      {categories.length > 0 && (
        <div style={{ display: 'flex', gap: '0.45rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
          <button
            onClick={() => updateParam('category', '')}
            className={`filter-chip ${!category ? 'active' : ''}`}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => updateParam('category', category === cat ? '' : cat)}
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Active Filter Badges */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>

        {category && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--accent-blue-subtle)',
            color: 'var(--accent-blue)',
            padding: '0.3rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            Category: {category}
            <X size={13} style={{ cursor: 'pointer' }} onClick={() => updateParam('category', '')} />
          </span>
        )}

        {location && (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            padding: '0.3rem 0.65rem',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}>
            Location: {location}
            <X size={13} style={{ cursor: 'pointer' }} onClick={() => updateParam('location', '')} />
          </span>
        )}
      </div>

      {/* Items Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading campus listings...
        </div>
      ) : items.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <Search size={42} color="var(--accent-blue)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Matching Items Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 1.25rem' }}>
            Try adjusting your search keywords, location filter, or category.
          </p>
          <button onClick={handleResetFilters} className="btn btn-secondary btn-sm">
            Clear All Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={16} /> Previous
          </button>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
            Page {page + 1} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="btn btn-secondary btn-sm"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Interactive Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        filters={{ type, category, location, status }}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />
    </div>
  );
};
