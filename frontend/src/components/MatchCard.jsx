import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, MessageSquare, MapPin, Sparkles, ImageOff, ArrowRight, User as UserIcon, Tag } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge } from './StatusBadge';

export const MatchCard = ({ match, currentItemId, onConfirm, onReject, onStartChat }) => {
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

  const isLostCurrent = currentItemId && String(currentItemId) === String(match.lostItemId);
  const isFoundCurrent = currentItemId && String(currentItemId) === String(match.foundItemId);
  const isFocusedOnItem = Boolean(isLostCurrent || isFoundCurrent);

  const candidate = isLostCurrent ? {
    id: match.foundItemId,
    title: match.foundItemTitle,
    category: match.foundItemCategory,
    location: match.foundItemLocation,
    imageUrl: match.foundItemImageUrl,
    ownerName: match.foundItemOwnerName,
    type: 'FOUND',
  } : {
    id: match.lostItemId,
    title: match.lostItemTitle,
    category: match.lostItemCategory,
    location: match.lostItemLocation,
    imageUrl: match.lostItemImageUrl,
    ownerName: match.lostItemOwnerName,
    type: 'LOST',
  };

  const current = isLostCurrent ? {
    id: match.lostItemId,
    title: match.lostItemTitle,
    type: 'LOST',
  } : {
    id: match.foundItemId,
    title: match.foundItemTitle,
    type: 'FOUND',
  };

  // Compatibility score tiers & visual confidence indicator
  const score = match.matchPercentage ?? Math.round((match.matchScore || 0) * 100);
  const isHighConfidence = score >= 70;
  const isModerateConfidence = score >= 50 && score < 70;

  const scoreBadgeBg = isHighConfidence 
    ? 'rgba(22, 163, 74, 0.12)' 
    : isModerateConfidence 
    ? 'rgba(245, 158, 11, 0.15)' 
    : 'rgba(148, 163, 184, 0.15)';
  const scoreBadgeColor = isHighConfidence 
    ? '#16A34A' 
    : isModerateConfidence 
    ? '#D97706' 
    : 'var(--text-secondary)';
  const scoreBadgeBorder = isHighConfidence 
    ? 'rgba(22, 163, 74, 0.3)' 
    : isModerateConfidence 
    ? 'rgba(245, 158, 11, 0.3)' 
    : 'var(--border-subtle)';
  const confidenceLabel = isHighConfidence 
    ? 'Strong Match' 
    : isModerateConfidence 
    ? 'Moderate Match' 
    : 'Low Confidence';

  return (
    <div className="surface-card surface-card-hover" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', backgroundColor: 'var(--bg-surface)' }}>
      {/* Top Header: Percentage Score & Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <span style={{
            backgroundColor: scoreBadgeBg,
            color: scoreBadgeColor,
            fontSize: '0.8125rem',
            fontWeight: 700,
            padding: '0.3rem 0.75rem',
            borderRadius: 'var(--radius-full)',
            border: `1px solid ${scoreBadgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <Sparkles size={14} /> {score}% • {confidenceLabel}
          </span>

          <StatusBadge matchStatus={match.status} />

          {match.lostItemCategory && match.foundItemCategory && match.lostItemCategory === match.foundItemCategory && (
            <span style={{ 
              fontSize: '0.725rem', 
              padding: '0.2rem 0.55rem', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: 'var(--bg-elevated)', 
              border: '1px solid var(--border-subtle)', 
              color: 'var(--text-secondary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Tag size={11} /> Same Category: {match.lostItemCategory}
            </span>
          )}

          {isFocusedOnItem && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Matched {candidate.type} Listing
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {getTimeAgo(match.createdAt)}
        </div>
      </div>

      {isFocusedOnItem ? (
        /* Focused Single Candidate View when displayed on ItemDetail page */
        <div style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}>
          {/* Candidate Item Photo Thumbnail */}
          <div style={{
            width: 100,
            height: 100,
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            {candidate.imageUrl ? (
              <img
                src={candidate.imageUrl}
                alt={candidate.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <ImageOff size={28} color="var(--text-muted)" />
            )}
          </div>

          {/* Details */}
          <div style={{ flex: 1, minWidth: 220, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`badge ${candidate.type === 'LOST' ? 'badge-lost' : 'badge-found'}`} style={{ fontSize: '0.7rem' }}>
                {candidate.type} ITEM
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Category: <strong style={{ color: 'var(--text-primary)' }}>{candidate.category || 'General'}</strong>
              </span>
            </div>

            <Link 
              to={`/items/${candidate.id}`} 
              style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}
              title={candidate.title}
            >
              {candidate.title}
            </Link>

            {candidate.location && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={13} color="var(--text-muted)" />
                <span>{candidate.location}</span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
              {candidate.ownerName && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <UserIcon size={12} /> {candidate.ownerName}
                </div>
              )}
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Matched with your listing: <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{current.title}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 2-Column Comparison Grid with Images when displayed on MatchesPage */
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
            minHeight: 125,
            height: '100%',
          }}>
            {/* Lost Item Photo Thumbnail with robust fallback */}
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
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div style={{ display: match.lostItemImageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageOff size={22} color="var(--text-muted)" />
              </div>
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <StatusBadge itemType="LOST" size="xs" />

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
                  <MapPin size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.lostItemLocation}</span>
                </div>
              )}

              {match.lostItemOwnerName && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 'auto', paddingTop: '0.2rem' }}>
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
            minHeight: 125,
            height: '100%',
          }}>
            {/* Found Item Photo Thumbnail with robust fallback */}
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
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.nextSibling) {
                      e.currentTarget.nextSibling.style.display = 'flex';
                    }
                  }}
                />
              ) : null}
              <div style={{ display: match.foundItemImageUrl ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageOff size={22} color="var(--text-muted)" />
              </div>
            </div>

            {/* Details */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <StatusBadge itemType="FOUND" size="xs" />

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
                  <MapPin size={12} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.foundItemLocation}</span>
                </div>
              )}

              {match.foundItemOwnerName && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: 'auto', paddingTop: '0.2rem' }}>
                  <UserIcon size={11} /> {match.foundItemOwnerName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
          {isFocusedOnItem ? (
            <Link to={`/items/${candidate.id}`} style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
              View Full {candidate.type.toLowerCase()} Listing →
            </Link>
          ) : (
            <>
              <Link to={`/items/${match.lostItemId}`} style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                View Lost Listing →
              </Link>
              <Link to={`/items/${match.foundItemId}`} style={{ color: '#16A34A', fontWeight: 600 }}>
                View Found Listing →
              </Link>
            </>
          )}
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
