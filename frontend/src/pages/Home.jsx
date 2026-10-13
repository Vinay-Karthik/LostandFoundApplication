import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemApi } from '../api/itemApi';
import { ItemCard } from '../components/ItemCard';
import { 
  Search, SlidersHorizontal, ShoppingBag, Laptop, 
  Shirt, FileText, Watch, Key, Box, 
  Sparkles, MessageCircle, AlertCircle, Plus 
} from 'lucide-react';

export const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadData = () => {
    Promise.all([
      itemApi.getItems({ size: 6, status: 'OPEN' }),
      itemApi.getCategories(),
    ]).then(([itemsRes, catRes]) => {
      if (itemsRes.success && itemsRes.data) {
        setItems(itemsRes.data.content || []);
      }
      if (catRes.success && catRes.data) {
        setCategories(catRes.data || []);
      }
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();

    const handleItemsUpdated = () => loadData();
    window.addEventListener('items-updated', handleItemsUpdated);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadData();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') loadData();
    }, 10000);

    return () => {
      window.removeEventListener('items-updated', handleItemsUpdated);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/items?search=${encodeURIComponent(searchQuery)}`);
  };

  const getCategoryIcon = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('elect')) return <Laptop size={20} />;
    if (n.includes('bag')) return <ShoppingBag size={20} />;
    if (n.includes('cloth')) return <Shirt size={20} />;
    if (n.includes('doc')) return <FileText size={20} />;
    if (n.includes('access')) return <Watch size={20} />;
    if (n.includes('key')) return <Key size={20} />;
    return <Box size={20} />;
  };

  const getCategoryBg = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('elect')) return '#1E1B4B';
    if (n.includes('bag')) return '#134E4A';
    if (n.includes('cloth')) return '#0E7490';
    if (n.includes('doc')) return '#581C87';
    if (n.includes('access')) return '#881337';
    if (n.includes('key')) return '#4C1D95';
    return '#14532D';
  };

  // ==========================================
  // SCREEN 1: UNAUTHENTICATED LANDING PAGE
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', paddingBottom: '3rem' }}>
        {/* Hero Section */}
        <section style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '3rem 2rem 1rem',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: '1.1fr 1fr',
          alignItems: 'center',
          gap: '3rem',
        }}>
          {/* Left Column Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h1 style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}>
              Lost Something?<br />
              <span style={{ color: 'var(--accent-blue)' }}>Let's Find It.</span>
            </h1>

            <p style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              maxWidth: 480,
            }}>
              <strong>CampusLost&Found</strong> helps students connect with others to recover lost items or return found ones quickly and easily.
            </p>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <Link 
                to="/register" 
                className="btn btn-coral btn-lg"
                style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 2rem', fontWeight: 700 }}
              >
                Get Started
              </Link>
              <Link 
                to="/items" 
                className="btn btn-yellow btn-lg"
                style={{ borderRadius: 'var(--radius-full)', padding: '0.75rem 2rem', fontWeight: 700 }}
              >
                Learn More
              </Link>
            </div>
          </div>

          {/* Right Column Illustration Graphic */}
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--accent-yellow-subtle)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xl)',
            padding: '2.5rem 1.5rem',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
              }}>
                <ShoppingBag size={72} color="var(--accent-blue)" strokeWidth={1.8} />
              </div>
              <div style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                padding: '0.75rem 1.5rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 700,
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '0.95rem',
              }}>
                🎓 University Campus Portal
              </div>
            </div>
          </div>
        </section>

        {/* 3 Bottom Feature Cards */}
        <section style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 2rem',
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}>
          {/* Card 1: Report */}
          <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
            }}>
              <AlertCircle size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Report Lost or Found
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Easily post details and photos of items lost or found on campus.
              </p>
            </div>
          </div>

          {/* Card 2: Smart Matching */}
          <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--accent-coral)' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-coral)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
            }}>
              <Sparkles size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Smart Matching
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Our system connects and alerts potential owners automatically.
              </p>
            </div>
          </div>

          {/* Card 3: Secure Communication */}
          <div className="surface-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', borderLeft: '4px solid var(--accent-blue)' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-blue)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              flexShrink: 0,
            }}>
              <MessageCircle size={26} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Secure Communication
              </h3>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Chat safely with others within the platform to coordinate return.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ==========================================
  // SCREEN 3: AUTHENTICATED STUDENT DASHBOARD
  // ==========================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Dashboard Greeting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Hello, {user?.name ? user.name.split(' ')[0] : 'Student'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            What are you looking for today?
          </p>
        </div>
        <Link 
          to="/post" 
          className="btn btn-primary"
          style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={16} strokeWidth={2.4} /> Report New
        </Link>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'center',
        }}
      >
        <div style={{
          flex: 1,
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
            placeholder="Search for items, categories or locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <button
          type="submit"
          className="btn btn-secondary"
          style={{ height: 44, padding: '0 1rem' }}
        >
          <SlidersHorizontal size={16} /> Filters
        </button>
      </form>

      {/* Browse Categories Row (Screen 3) */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.85rem', color: 'var(--text-primary)' }}>
          Browse Categories
        </h2>

        <div style={{ display: 'flex', gap: '0.85rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => navigate(`/items?category=${encodeURIComponent(cat)}`)}
              className="category-tile"
            >
              <div
                className="category-icon-box"
                style={{ backgroundColor: getCategoryBg(cat) }}
              >
                {getCategoryIcon(cat)}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', textAlign: 'center' }}>
                {cat}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Listings Section (Screen 3) */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Listings
          </h2>
          <Link to="/items" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
            View all
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Loading recent listings...
          </div>
        ) : items.length === 0 ? (
          <div className="surface-card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No open listings right now.</p>
            <Link to="/post" className="btn btn-primary btn-sm" style={{ marginTop: '0.85rem' }}>
              <Plus size={14} /> Report an Item
            </Link>
          </div>
        ) : (
          <div className="grid-cards">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
