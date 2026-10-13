import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ImageOff, Sparkles, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bookmarkApi } from '../api/bookmarkApi';
import { useAuth } from '../context/AuthContext';

export const ItemCard = ({ item, isBookmarkedDefault = false, onBookmarkToggle }) => {
  const isLost = item.type === 'LOST';
  const { isAuthenticated } = useAuth();
  const [bookmarked, setBookmarked] = useState(isBookmarkedDefault);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const getTimeAgo = (dateStr) => {
    try {
      if (!dateStr) return 'Recently';
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) return;
    setBookmarkLoading(true);
    try {
      if (bookmarked) {
        await bookmarkApi.removeBookmark(item.id);
        setBookmarked(false);
        if (onBookmarkToggle) onBookmarkToggle(item.id, false);
      } else {
        await bookmarkApi.addBookmark(item.id);
        setBookmarked(true);
        if (onBookmarkToggle) onBookmarkToggle(item.id, true);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  return (
    <Link to={`/items/${item.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}>
      <div 
        className="surface-card surface-card-hover"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface)',
          position: 'relative',
        }}
      >
        {/* Photo Container */}
        <div style={{
          aspectRatio: '4 / 3',
          backgroundColor: 'var(--bg-elevated)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
              <ImageOff size={24} />
              <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>No photo</span>
            </div>
          )}

          {/* Status Badge */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
          }}>
            <span className={`badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
              {item.type}
            </span>
          </div>

          {/* Bookmark Button */}
          {isAuthenticated && (
            <button
              onClick={handleBookmarkClick}
              disabled={bookmarkLoading}
              title={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 30,
                height: 30,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: bookmarked ? 'var(--accent-coral)' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'transform 0.15s ease',
                zIndex: 2,
              }}
            >
              <Bookmark size={14} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={2.2} />
            </button>
          )}

          {/* Category Tag */}
          {item.category && (
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 10,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              padding: '0.15rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#FFFFFF',
            }}>
              {item.category}
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: '0.35rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
          }}>
            {item.title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <MapPin size={12} color="var(--text-muted)" />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.location || 'Campus'}
            </span>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <span>{getTimeAgo(item.dateReported || item.createdAt)}</span>
            {item.matchCount > 0 && (
              <span style={{ color: 'var(--accent-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                <Sparkles size={11} /> {item.matchCount} match{item.matchCount > 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
