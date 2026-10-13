import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ImageOff, Sparkles, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { bookmarkApi } from '../api/bookmarkApi';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from './StatusBadge';

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
          height: 160,
          width: '100%',
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
                transition: 'transform 0.3s ease',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) {
                  e.currentTarget.nextSibling.style.display = 'flex';
                }
              }}
            />
          ) : null}
          <div style={{ display: item.imageUrl ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
            <ImageOff size={24} />
            <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>No photo</span>
          </div>

          {/* Status Badge */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 2,
          }}>
            <StatusBadge itemType={item.type} />
          </div>

          {/* Bookmark Button */}
          {isAuthenticated && (
            <button
              onClick={handleBookmarkClick}
              disabled={bookmarkLoading}
              title={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
              aria-label={bookmarked ? 'Remove bookmark' : 'Save bookmark'}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                width: 32,
                height: 32,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: bookmarked ? 'var(--accent-coral)' : '#FFFFFF',
                cursor: 'pointer',
                transition: 'transform 0.15s ease, background-color 0.15s ease',
                zIndex: 3,
              }}
            >
              <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} strokeWidth={2.2} />
            </button>
          )}

          {/* Category Tag Overlay */}
          {item.category && (
            <div style={{
              position: 'absolute',
              bottom: 8,
              right: 10,
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              padding: '0.2rem 0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#FFFFFF',
              zIndex: 2,
            }}>
              {item.category}
            </div>
          )}
        </div>

        {/* Content with comfortable spacing to prevent clipping */}
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 120 }}>
          <h3 style={{
            fontSize: '0.95rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            marginBottom: '0.4rem',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.7em',
          }}>
            {item.title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.775rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
            <MapPin size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.location || 'Campus'}
            </span>
          </div>

          <div style={{
            marginTop: 'auto',
            paddingTop: '0.65rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            flexWrap: 'wrap',
            gap: '0.35rem',
          }}>
            <span>{getTimeAgo(item.dateReported || item.createdAt)}</span>
            {item.matchCount > 0 && (
              <span style={{ color: 'var(--accent-blue)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Sparkles size={12} /> {item.matchCount} match{item.matchCount > 1 ? 'es' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};
