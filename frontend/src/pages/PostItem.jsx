import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { itemApi } from '../api/itemApi';
import { ImageUpload } from '../components/ImageUpload';
import { ShieldAlert, AlertCircle } from 'lucide-react';

export const PostItem = () => {
  const { isAuthenticated, isVerified, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [type, setType] = useState(searchParams.get('type') || 'LOST');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [location, setLocation] = useState('');
  const [tags, setTags] = useState('');
  const [dateReported, setDateReported] = useState(new Date().toISOString().split('T')[0]);
  const [imageFile, setImageFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    itemApi.getCategories().then((res) => {
      if (res.success && res.data) setCategories(res.data);
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the item');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('category', category);
      formData.append('location', location.trim());
      formData.append('tags', tags.trim());
      formData.append('dateReported', dateReported);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await itemApi.createItemMultipart(formData);
      if (res.success && res.data) {
        navigate(`/items/${res.data.id}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="surface-card" style={{ maxWidth: 460, margin: '4rem auto', padding: '2.5rem', textAlign: 'center' }}>
        <AlertCircle size={40} color="var(--accent-blue)" style={{ margin: '0 auto 0.75rem' }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Authentication Required</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Please log in with your university account to post an item.
        </p>
        <button onClick={() => navigate('/login')} className="btn btn-primary btn-sm">
          Go to Login
        </button>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="surface-card" style={{ maxWidth: 500, margin: '4rem auto', padding: '2.5rem', textAlign: 'center' }}>
        <ShieldAlert size={40} color="var(--accent-yellow)" style={{ margin: '0 auto 0.75rem' }} />
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Pending Verification</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '0.875rem' }}>
          Your student account (<strong>{user?.email}</strong>) is currently awaiting administrative approval.
        </p>
        <div style={{ marginTop: '1.25rem' }}>
          <button onClick={() => navigate('/items')} className="btn btn-secondary btn-sm">
            Browse Listings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header (Screen 6) */}
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Report Lost or Found Item</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
          Fill in the details about your item.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="surface-card" style={{ padding: '2rem', backgroundColor: 'var(--bg-surface)' }}>
        {error && (
          <div style={{
            padding: '0.65rem 0.85rem',
            backgroundColor: 'var(--status-lost-bg)',
            border: '1px solid var(--status-lost-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--status-lost-text)',
            fontSize: '0.8125rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        {/* Radio Type Selector: Lost vs Found (Screen 6) */}
        <div className="form-group">
          <label className="form-label">Type</label>
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              <input
                type="radio"
                name="type"
                value="LOST"
                checked={type === 'LOST'}
                onChange={() => setType('LOST')}
                style={{ accentColor: 'var(--accent-coral)', width: 18, height: 18 }}
              />
              <span style={{ color: type === 'LOST' ? 'var(--accent-coral)' : 'var(--text-secondary)' }}>Lost</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              <input
                type="radio"
                name="type"
                value="FOUND"
                checked={type === 'FOUND'}
                onChange={() => setType('FOUND')}
                style={{ accentColor: '#16A34A', width: 18, height: 18 }}
              />
              <span style={{ color: type === 'FOUND' ? '#16A34A' : 'var(--text-secondary)' }}>Found</span>
            </label>
          </div>
        </div>

        {/* Item Name & Date */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Item Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Black Laptop Bag"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date {type === 'LOST' ? 'Lost' : 'Found'}</label>
            <input
              type="date"
              className="form-input"
              value={dateReported}
              onChange={(e) => setDateReported(e.target.value)}
            />
          </div>
        </div>

        {/* Category & Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Campus Location</label>
            <input
              type="text"
              list="campus-locations-list"
              className="form-input"
              placeholder="e.g. Main Library, 2nd Floor"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <datalist id="campus-locations-list">
              <option value="Main Library" />
              <option value="Main Library - 2nd Floor" />
              <option value="Student Activity Center" />
              <option value="Campus Cafeteria" />
              <option value="Science & Tech Complex" />
              <option value="Engineering Hall" />
              <option value="Sports & Fitness Center" />
              <option value="North Parking Lot B" />
              <option value="Auditorium Hall B" />
              <option value="Student Dormitories" />
            </datalist>
          </div>
        </div>

        {/* Description */}
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Provide more details about the item..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Tags */}
        <div className="form-group">
          <label className="form-label">Tags (Optional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Add tags (e.g. #usb, #airpods, #black)"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
        </div>

        {/* Upload Photos */}
        <div className="form-group">
          <label className="form-label">Upload Photos</label>
          <ImageUpload onFileSelect={setImageFile} />
        </div>

        {/* Submit Button (Screen 6 Coral Button) */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-coral"
            style={{ padding: '0.75rem 2rem', borderRadius: 'var(--radius-md)', fontSize: '0.95rem' }}
          >
            {submitting ? 'Submitting...' : 'Submit Item'}
          </button>
        </div>
      </form>
    </div>
  );
};
