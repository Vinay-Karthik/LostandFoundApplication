import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, MessageSquare, MapPin, Sparkles, ImageOff, ArrowRight, User as UserIcon } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDistanceToNow } from 'date-fns';

export const MatchCard = ({ match, onConfirm, onReject, onStartChat }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(match.id);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(match.id);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateStr) => {
    try {
      if (!dateStr) return 'Recently';
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const isConfirmed = match.status === 'CONFIRMED';
  const isRejected = match.status === 'REJECTED';
  const isSuggested = match.status === 'SUGGESTED';

  return (
    <div className="surface-card surface-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
      {/* Top Header: Percentage Score & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <span style={{
            backgroundColor: 'var(--accent-blue-subtle)',
            color: 'var(--accent-blue)',
            fontSize: '0.85rem',
            fontWeight: 700,
            padding: '0.3rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <Sparkles size={14} /> {match.matchPercentage}% Compatibility Match
          </span>

          <span className={`badge ${isConfirmed ? 'badge-found' : isRejected ? 'badge-lost' : 'badge-matched'}`}>
            {match.status}
          </span>
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {getTimeAgo(match.createdAt)}
        </div>
      </div>

      {/* 2-Column Comparison Grid with Images */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Left Side: Lost Item Card */}
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}>
          {/* Lost Item Photo Thumbnail */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {match.lostItemImageUrl ? (
              <img
                src={match.lostItemImageUrl}
                alt={match.lostItemTitle}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <ImageOff size={22} color="var(--text-muted)" />
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="badge badge-lost" style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
              LOST ITEM
            </span>

            <Link 
              to={`/items/${match.lostItemId}`} 
              style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={match.lostItemTitle}
            >
              {match.lostItemTitle}
            </Link>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Category: <strong style={{ color: 'var(--text-primary)' }}>{match.lostItemCategory || 'General'}</strong>
            </div>

            {match.lostItemLocation && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={12} color="var(--text-muted)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.lostItemLocation}</span>
              </div>
            )}

            {match.lostItemOwnerName && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                <UserIcon size={11} /> {match.lostItemOwnerName}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Found Item Card */}
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-start',
        }}>
          {/* Found Item Photo Thumbnail */}
          <div style={{
            width: 80,
            height: 80,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {match.foundItemImageUrl ? (
              <img
                src={match.foundItemImageUrl}
                alt={match.foundItemTitle}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <ImageOff size={22} color="var(--text-muted)" />
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="badge badge-found" style={{ alignSelf: 'flex-start', fontSize: '0.7rem' }}>
              FOUND ITEM
            </span>

            <Link 
              to={`/items/${match.foundItemId}`} 
              style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              title={match.foundItemTitle}
            >
              {match.foundItemTitle}
            </Link>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Category: <strong style={{ color: 'var(--text-primary)' }}>{match.foundItemCategory || 'General'}</strong>
            </div>

            {match.foundItemLocation && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={12} color="var(--text-muted)" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.foundItemLocation}</span>
              </div>
            )}

            {match.foundItemOwnerName && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.2rem' }}>
                <UserIcon size={11} /> {match.foundItemOwnerName}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        {/* Direct Item Links */}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8125rem' }}>
          <Link to={`/items/${match.lostItemId}`} style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
            View Lost Listing →
          </Link>
          <Link to={`/items/${match.foundItemId}`} style={{ color: '#16A34A', fontWeight: 600 }}>
            View Found Listing →
          </Link>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {isSuggested && (
            <>
              <button
                onClick={handleReject}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.45rem 0.85rem' }}
              >
                <X size={14} /> Not a Match
              </button>
              <button
                onClick={handleConfirm}
                disabled={loading}
                className="btn btn-primary btn-sm"
                style={{ padding: '0.45rem 1rem' }}
              >
                <Check size={14} /> Confirm Match
              </button>
            </>
          )}

          {isConfirmed && onStartChat && (
            <button
              onClick={() => onStartChat(match)}
              className="btn btn-coral btn-sm"
              style={{ padding: '0.45rem 1rem' }}
            >
              <MessageSquare size={14} /> Message Counterpart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
