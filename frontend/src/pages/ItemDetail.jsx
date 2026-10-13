import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { itemApi } from '../api/itemApi';
import { matchApi } from '../api/matchApi';
import { bookmarkApi } from '../api/bookmarkApi';
import { useAuth } from '../context/AuthContext';
import { MatchCard } from '../components/MatchCard';
import { ReportModal } from '../components/ReportModal';
import { ResolutionModal } from '../components/ResolutionModal';
import { 
  MapPin, MessageSquare, 
  Sparkles, AlertTriangle, ArrowLeft, Check, Edit3, ImageOff, Bookmark, CheckCircle2 
} from 'lucide-react';
import { format } from 'date-fns';

export const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [item, setItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [resolutionModalOpen, setResolutionModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('OPEN');
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  const fetchItemData = () => {
    setLoading(true);
    Promise.all([
      itemApi.getItemById(id),
      isAuthenticated ? matchApi.getMatchesForItem(id) : Promise.resolve({ data: [] }),
      isAuthenticated ? bookmarkApi.checkBookmark(id).catch(() => ({ data: { bookmarked: false } })) : Promise.resolve({ data: { bookmarked: false } }),
    ]).then(([itemRes, matchRes, bookmarkRes]) => {
      if (itemRes.success && itemRes.data) {
        setItem(itemRes.data);
        setNewStatus(itemRes.data.status);
      }
      if (matchRes.success && matchRes.data) {
        setMatches(matchRes.data || []);
      }
      if (bookmarkRes.data && bookmarkRes.data.bookmarked !== undefined) {
        setIsBookmarked(bookmarkRes.data.bookmarked);
      }
    }).catch((err) => {
      console.error(err);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchItemData();
  }, [id, isAuthenticated]);

  const handleBookmarkToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await bookmarkApi.removeBookmark(id);
        setIsBookmarked(false);
      } else {
        await bookmarkApi.addBookmark(id);
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleConfirmMatch = async (matchId) => {
    await matchApi.confirmMatch(matchId);
    fetchItemData();
  };

  const handleRejectMatch = async (matchId) => {
    await matchApi.rejectMatch(matchId);
    fetchItemData();
  };

  const handleStatusChange = async () => {
    setStatusUpdating(true);
    try {
      await itemApi.updateItemJson(id, { status: newStatus });
      setEditingStatus(false);
      if (newStatus === 'RESOLVED') {
        setResolutionModalOpen(true);
      }
      fetchItemData();
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleStartChat = (match) => {
    const targetUserId = match.lostItemOwnerId === user?.id 
      ? match.foundItemOwnerId 
      : match.lostItemOwnerId;
    navigate(`/messages?userId=${targetUserId}`);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        Loading item details...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="surface-card" style={{ maxWidth: 460, margin: '4rem auto', padding: '2.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Item Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          This listing may have been resolved or removed.
        </p>
        <button onClick={() => navigate('/items')} className="btn btn-primary btn-sm">
          Back to Listings
        </button>
      </div>
    );
  }

  const isOwner = item.isOwner || item.userId === user?.id;
  const isLost = item.type === 'LOST';
  const isResolved = item.status === 'RESOLVED';
  const tagList = item.tags ? item.tags.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Back to Listings */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/items')} 
          className="btn btn-ghost btn-sm" 
          style={{ padding: '0.35rem 0.65rem', color: 'var(--text-secondary)', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Listings
        </button>

        {/* Bookmark Button */}
        {isAuthenticated && (
          <button
            onClick={handleBookmarkToggle}
            disabled={bookmarkLoading}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Bookmark size={14} fill={isBookmarked ? 'currentColor' : 'none'} color={isBookmarked ? 'var(--accent-coral)' : 'currentColor'} />
            {isBookmarked ? 'Saved to Bookmarks' : 'Bookmark Item'}
          </button>
        )}
      </div>

      {/* Main Detail Card Container */}
      <div className="surface-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 440px) 1fr',
          gap: '2.5rem',
        }}>
          {/* Left Column: Image & Reported By Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Primary Photo */}
            <div style={{
              width: '100%',
              aspectRatio: '4 / 3',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-elevated)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-subtle)',
            }}>
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
                  <ImageOff size={40} />
                  <span style={{ fontSize: '0.8125rem', marginTop: '0.5rem' }}>No photo uploaded</span>
                </div>
              )}
            </div>

            {/* Reported By Card */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1rem',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--accent-blue-subtle)',
                  border: '2px solid var(--accent-blue)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  color: 'var(--accent-blue)',
                }}>
                  {item.userName ? item.userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reported By</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.userName || 'Campus Student'}
                  </div>
                </div>
              </div>

              {!isOwner && (
                isAuthenticated ? (
                  <button
                    onClick={() => navigate(`/messages?userId=${item.userId}`)}
                    className="btn btn-coral btn-sm"
                    style={{ borderRadius: 'var(--radius-md)', padding: '0.45rem 0.85rem' }}
                  >
                    <MessageSquare size={14} /> Send Message
                  </button>
                ) : (
                  <Link to="/login" className="btn btn-coral btn-sm">
                    Login to Chat
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Right Column: Title, Description & Metadata Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className={`badge ${isLost ? 'badge-lost' : 'badge-found'}`}>
                  {item.type}
                </span>
                <span className={`badge ${item.status === 'RESOLVED' ? 'badge-found' : item.status === 'MATCHED' ? 'badge-matched' : 'badge-lost'}`}>
                  {item.status}
                </span>
              </div>

              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {item.title}
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.35rem' }}>
                <MapPin size={14} color="var(--text-muted)" />
                <span>{item.location || 'Campus'}</span>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Reported {item.dateReported ? format(new Date(item.dateReported), 'MMMM d, yyyy') : 'Recently'}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                Description
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {item.description || 'No description provided.'}
              </p>
            </div>

            {/* Structured Details Table */}
            <div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Details
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                backgroundColor: 'var(--bg-elevated)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.85rem',
              }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Category:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{item.category || 'General'}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Status:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{item.status}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Date {isLost ? 'Lost' : 'Found'}:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {item.dateReported ? format(new Date(item.dateReported), 'd MMM yyyy') : 'Recently'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Location:</span>{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>{item.location || 'Campus'}</strong>
                </div>
              </div>
            </div>

            {/* Tags */}
            {tagList.length > 0 && (
              <div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                  Tags:
                </span>
                <span style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {tagList.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.75rem',
                        backgroundColor: 'var(--accent-blue-subtle)',
                        color: 'var(--accent-blue)',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 600,
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </span>
              </div>
            )}

            {/* Handover Certificate Button if Resolved */}
            {isResolved && (
              <div style={{ marginTop: '0.5rem' }}>
                <button
                  onClick={() => setResolutionModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#16A34A' }}
                >
                  <CheckCircle2 size={15} /> View Handover Receipt
                </button>
              </div>
            )}

            {/* Owner Management Controls */}
            {isOwner && (
              <div style={{
                marginTop: 'auto',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                {editingStatus ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="form-select"
                      style={{ maxWidth: 140, padding: '0.4rem 0.6rem' }}
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="MATCHED">MATCHED</option>
                      <option value="RESOLVED">RESOLVED</option>
                    </select>
                    <button
                      onClick={handleStatusChange}
                      disabled={statusUpdating}
                      className="btn btn-primary btn-sm"
                    >
                      <Check size={14} /> Save Status
                    </button>
                    <button
                      onClick={() => setEditingStatus(false)}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingStatus(true)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit3 size={14} /> Update Listing Status
                  </button>
                )}
              </div>
            )}

            {/* Non-Owner Report Option */}
            {!isOwner && isAuthenticated && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--status-lost-text)', fontSize: '0.75rem' }}
                >
                  <AlertTriangle size={14} /> Report Listing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Matches Section */}
      {matches.length > 0 && (
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent-blue)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Suggested Matches ({matches.length})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onConfirm={handleConfirmMatch}
                onReject={handleRejectMatch}
                onStartChat={handleStartChat}
              />
            ))}
          </div>
        </section>
      )}

      {/* Report Modal */}
      <ReportModal
        itemId={item.id}
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={() => alert('Report submitted for moderation.')}
      />

      {/* Handover & Resolution Receipt Modal */}
      <ResolutionModal
        isOpen={resolutionModalOpen}
        onClose={() => setResolutionModalOpen(false)}
        item={item}
      />
    </div>
  );
};
