import React, { useState } from 'react';
import { X, Check, Filter, RotateCcw, MapPin, Tag, Calendar, Layers } from 'lucide-react';

const CAMPUS_LOCATIONS = [
  'Main Library',
  'Main Library - 2nd Floor',
  'Student Activity Center',
  'Campus Cafeteria',
  'Science & Tech Complex',
  'Engineering Hall',
  'Sports & Fitness Center',
  'North Parking Lot B',
  'Auditorium Hall B',
  'Student Dormitories',
];

const CATEGORIES = [
  'Electronics',
  'Keys',
  'Bags',
  'Clothing',
  'Documents',
  'Accessories',
  'Other',
];

export const FilterModal = ({ isOpen, onClose, filters, onApplyFilters, onResetFilters }) => {
  const [selectedType, setSelectedType] = useState(filters.type || 'ALL');
  const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
  const [selectedLocation, setSelectedLocation] = useState(filters.location || '');
  const [selectedStatus, setSelectedStatus] = useState(filters.status || 'OPEN');
  const [selectedDateRange, setSelectedDateRange] = useState(filters.dateRange || 'ALL');

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyFilters({
      type: selectedType,
      category: selectedCategory,
      location: selectedLocation,
      status: selectedStatus,
      dateRange: selectedDateRange,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedType('ALL');
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedStatus('OPEN');
    setSelectedDateRange('ALL');
    if (onResetFilters) {
      onResetFilters();
    }
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }}>
      <div className="surface-card" style={{
        width: '100%',
        maxWidth: 560,
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Filter Campus Listings
            </h3>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 1. Item Type */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Layers size={14} color="var(--text-muted)" /> Item Type
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'ALL', label: 'All Items' },
              { id: 'LOST', label: 'Lost Items' },
              { id: 'FOUND', label: 'Found Items' },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedType(t.id)}
                className={`filter-chip ${selectedType === t.id ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Category Selector */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Tag size={14} color="var(--text-muted)" /> Category
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`filter-chip ${selectedCategory === '' ? 'active' : ''}`}
            >
              All Categories
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Campus Location Presets */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <MapPin size={14} color="var(--text-muted)" /> Campus Location / Zone
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="form-input"
          >
            <option value="">Any Campus Location</option>
            {CAMPUS_LOCATIONS.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
        </div>

        {/* 4. Listing Status */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            Listing Status
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {[
              { id: 'OPEN', label: 'Open (Active)' },
              { id: 'MATCHED', label: 'Matched' },
              { id: 'RESOLVED', label: 'Resolved / Returned' },
            ].map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStatus(s.id)}
                className={`filter-chip ${selectedStatus === s.id ? 'active' : ''}`}
                style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Date Range */}
        <div>
          <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
            <Calendar size={14} color="var(--text-muted)" /> Date Range
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '3DAYS', label: 'Past 3 Days' },
              { id: '7DAYS', label: 'Past Week' },
              { id: '30DAYS', label: 'Past Month' },
            ].map(d => (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDateRange(d.id)}
                className={`filter-chip ${selectedDateRange === d.id ? 'active' : ''}`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-ghost btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Check size={14} /> Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
