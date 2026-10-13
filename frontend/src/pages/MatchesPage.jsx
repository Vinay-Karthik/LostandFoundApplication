import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { matchApi } from '../api/matchApi';
import { useAuth } from '../context/AuthContext';
import { MatchCard } from '../components/MatchCard';
import { Sparkles, ArrowRight, Package } from 'lucide-react';

export const MatchesPage = () => {
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'SUGGESTED' | 'CONFIRMED' | 'REJECTED'
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const fetchMatches = (showLoading = false) => {
    if (showLoading) setLoading(true);
    matchApi.getMyMatches().then((res) => {
      if (res.success && res.data) {
        setMatches(res.data);
      }
    }).catch(console.error).finally(() => {
      if (showLoading) setLoading(false);
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMatches(true);

    const handleMatchesUpdated = () => fetchMatches(false);
    window.addEventListener('matches-updated', handleMatchesUpdated);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchMatches(false);
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchMatches(false);
    }, 8000);

    return () => {
      window.removeEventListener('matches-updated', handleMatchesUpdated);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, [isAuthenticated, navigate]);

  const handleConfirmMatch = async (matchId) => {
    await matchApi.confirmMatch(matchId);
    fetchMatches();
  };

  const handleRejectMatch = async (matchId) => {
    await matchApi.rejectMatch(matchId);
    fetchMatches();
  };

  const handleStartChat = (match) => {
    const targetUserId = match.lostItemOwnerId === user?.id 
      ? match.foundItemOwnerId 
      : match.lostItemOwnerId;
    navigate(`/messages?userId=${targetUserId}`);
  };

  const validMatches = matches.filter((m) => m.lostItemId !== m.foundItemId);

  const allCount = validMatches.length;
  const suggestedCount = validMatches.filter((m) => m.status === 'SUGGESTED').length;
  const confirmedCount = validMatches.filter((m) => m.status === 'CONFIRMED').length;
  const rejectedCount = validMatches.filter((m) => m.status === 'REJECTED').length;

  const filteredMatches = validMatches.filter((m) => {
    if (activeTab === 'ALL') return true;
    return m.status === activeTab;
  });

  // Sort matches by compatibility score descending so high confidence pairs appear first
  const sortedMatches = [...filteredMatches].sort((a, b) => {
    const scoreA = a.matchPercentage ?? (a.matchScore ? a.matchScore * 100 : 0);
    const scoreB = b.matchPercentage ?? (b.matchScore ? b.matchScore * 100 : 0);
    return scoreB - scoreA;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Suggested Matches</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Automated smart pairings calculated between your reported items and counterpart listings on campus.
        </p>
      </div>

      {/* Filter Tabs with Synchronized Counts */}
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '0.25rem', overflowX: 'auto' }}>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`tab-chip ${activeTab === 'ALL' ? 'active' : ''}`}
        >
          All Matches ({allCount})
        </button>
        <button
          onClick={() => setActiveTab('SUGGESTED')}
          className={`tab-chip ${activeTab === 'SUGGESTED' ? 'active' : ''}`}
        >
          Suggested ({suggestedCount})
        </button>
        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`tab-chip ${activeTab === 'CONFIRMED' ? 'active' : ''}`}
        >
          Confirmed ({confirmedCount})
        </button>
        {rejectedCount > 0 && (
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`tab-chip ${activeTab === 'REJECTED' ? 'active' : ''}`}
          >
            Rejected ({rejectedCount})
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Searching for potential matches...
        </div>
      ) : sortedMatches.length === 0 ? (
        <div className="surface-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: 'var(--bg-surface)' }}>
          <Sparkles size={40} color="var(--accent-blue)" style={{ margin: '0 auto 0.75rem', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
            No {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} matches right now
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 460, margin: '0 auto 1.25rem' }}>
            When items are reported that share keywords, categories, and locations with your items, our matching engine will automatically pair them here.
          </p>
          <Link to="/items" className="btn btn-secondary btn-sm">
            Browse All Listings
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {sortedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              onConfirm={handleConfirmMatch}
              onReject={handleRejectMatch}
              onStartChat={handleStartChat}
            />
          ))}
        </div>
      )}
    </div>
  );
};
