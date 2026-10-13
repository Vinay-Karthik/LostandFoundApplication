import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookmarkApi } from '../api/bookmarkApi';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Sparkles, Compass } from 'lucide-react';
import { ItemCard } from '../components/ItemCard';

export const BookmarksPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchBookmarks = () => {
    setLoading(true);
    bookmarkApi.getUserBookmarks()
      .then((res) => {
        if (res.success && res.data) {
          setItems(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchBookmarks();
  }, [isAuthenticated, navigate]);

  const handleBookmarkToggle = (itemId, isNowBookmarked) => {
    if (!isNowBookmarked) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)' }}>Saved Bookmarks</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Quick access to important campus listings you have saved for later review.
          </p>
        </div>

        <Link to="/items" className="btn btn-secondary btn-sm">
          <Compass size={14} /> Browse All Listings
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Loading saved bookmarks...
        </div>
      ) : items.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '4rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <Bookmark size={42} color="var(--accent-blue)" style={{ margin: '0 auto 1rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No Saved Bookmarks Yet
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 1.5rem' }}>
            Click the bookmark icon on any item card across the catalog to save it here for quick reference.
          </p>
          <Link to="/items" className="btn btn-primary btn-sm">
            Explore Campus Listings
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.25rem',
        }}>
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isBookmarkedDefault={true}
              onBookmarkToggle={handleBookmarkToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};
